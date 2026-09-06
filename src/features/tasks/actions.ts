// Task submit actions (server only, "use server").
//
// The explanation and the correct option leave the server only here,
// after an attempt has been validated and stored. The task page itself
// (see ./queries.ts) never receives them before the attempt.

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  canMarkMastered,
  updateMasteryScore,
} from "@/features/learning-engine";
import type { Difficulty, MasteryLevel } from "@/generated/prisma/enums";

const DAY_MS = 24 * 3600 * 1000;
const MAX_NOTE_LENGTH = 1000;

export interface AttemptMeta {
  confidence: number | null; // 1-5, null = not rated
  usedAi: boolean;
  perceivedDifficulty: Difficulty | null;
  mistakeNote: string;
}

export interface SubmitChoiceInput extends AttemptMeta {
  questionId: string;
  selectedOptionId: string;
}

export interface RevealTextInput {
  questionId: string;
  textAnswer: string;
}

export interface SubmitTextInput extends AttemptMeta {
  questionId: string;
  textAnswer: string;
  wasCorrect: boolean;
}

export interface SubmitResult {
  answerId: string;
  isCorrect: boolean;
  /** Null for free-text questions (no options to highlight). */
  correctOptionId: string | null;
  /** Null when the author left no explanation. */
  explanation: string | null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function checkMeta(meta: AttemptMeta): void {
  if (
    meta.confidence !== null &&
    (!Number.isInteger(meta.confidence) || meta.confidence < 1 || meta.confidence > 5)
  ) {
    throw new Error("Confidence must be a number from 1 to 5.");
  }
  if (
    meta.perceivedDifficulty !== null &&
    meta.perceivedDifficulty !== "BEGINNER" &&
    meta.perceivedDifficulty !== "INTERMEDIATE" &&
    meta.perceivedDifficulty !== "ADVANCED"
  ) {
    throw new Error("Difficulty rating is invalid.");
  }
  if (meta.mistakeNote.length > MAX_NOTE_LENGTH) {
    throw new Error(`Mistake note must be under ${MAX_NOTE_LENGTH} characters.`);
  }
}

function checkId(value: string, name: string): void {
  if (!value || value.trim().length === 0) throw new Error(`${name} is required.`);
}

/** Today's active session for this skill, or a new one. Answers attach
 *  to a session so the dashboard "progress" section stays meaningful. */
async function getOrCreateSession(
  userId: string,
  skillId: string,
  now: Date,
): Promise<string> {
  const existing = await db.learningSession.findFirst({
    where: { userId, skillId, status: "ACTIVE", startedAt: { gte: startOfDay(now) } },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await db.learningSession.create({
    data: { userId, skillId, status: "ACTIVE", startedAt: now },
    select: { id: true },
  });
  return created.id;
}

/**
 * Move mastery, spaced-repetition, and mistake state forward by one attempt.
 * Mastery moves in bounded steps (see learning-engine/mastery.ts), so a
 * single answer can never grant mastery.
 */
async function syncMasteryAndReview(
  userId: string,
  topicId: string,
  questionId: string,
  isCorrect: boolean,
  now: Date,
): Promise<void> {
  const [mastery, topicAnswers, unresolvedMistakes, dueReviews] = await Promise.all([
    db.topicMastery.findUnique({ where: { userId_topicId: { userId, topicId } } }),
    db.answer.findMany({
      where: { userId, question: { topicId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { isCorrect: true },
    }),
    db.mistake.count({ where: { userId, topicId, isResolved: false } }),
    db.review.count({
      where: {
        userId,
        status: "DUE",
        dueAt: { lte: now },
        OR: [{ topicId }, { question: { topicId } }],
      },
    }),
  ]);

  const currentScore = mastery?.score ?? 0;
  const attempts = await db.answer.count({
    where: { userId, question: { topicId } },
  });
  const nextScore = updateMasteryScore({ currentScore, isCorrect, attempts });
  const recentAccuracy =
    topicAnswers.length > 0
      ? topicAnswers.filter((a) => a.isCorrect).length / topicAnswers.length
      : null;
  const { eligible } = canMarkMastered({
    score: nextScore,
    attempts,
    recentAccuracy,
    unresolvedMistakes,
    dueReviewsCount: dueReviews,
  });

  let level: MasteryLevel = "LEARNING";
  if (eligible) level = "MASTERED";
  else if (attempts === 0) level = "NOT_STARTED";
  else if (nextScore >= 50) level = "REVIEWING";

  await db.topicMastery.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: { userId, topicId, level, score: nextScore, lastStudiedAt: now },
    update: { level, score: nextScore, lastStudiedAt: now },
  });

  // Spaced repetition, SM-2 lite: a correct answer doubles the interval
  // (capped at 60 days); a wrong answer resets it to tomorrow.
  const existingReview = await db.review.findFirst({
    where: { userId, questionId, status: "DUE" },
    orderBy: { dueAt: "asc" },
  });
  if (existingReview) {
    const intervalDays = isCorrect
      ? Math.min(60, Math.max(2, existingReview.intervalDays * 2))
      : 1;
    await db.review.update({
      where: { id: existingReview.id },
      data: {
        intervalDays,
        dueAt: new Date(now.getTime() + intervalDays * DAY_MS),
        lastReviewedAt: now,
        easeFactor: isCorrect
          ? Math.min(3, existingReview.easeFactor + 0.1)
          : Math.max(1.3, existingReview.easeFactor - 0.2),
      },
    });
  } else if (!isCorrect) {
    await db.review.create({
      data: {
        userId,
        questionId,
        topicId,
        dueAt: new Date(now.getTime() + DAY_MS),
        status: "DUE",
        intervalDays: 1,
      },
    });
  }
}

async function maybeCreateMistake(args: {
  userId: string;
  topicId: string;
  questionId: string;
  answerId: string;
  note: string;
}): Promise<void> {
  const note = args.note.trim();
  if (note.length === 0) return;
  await db.mistake.create({
    data: {
      userId: args.userId,
      topicId: args.topicId,
      questionId: args.questionId,
      answerId: args.answerId,
      note,
    },
  });
}

/** Grade a multiple-choice / true-false attempt and store it. */
export async function submitChoice(input: SubmitChoiceInput): Promise<SubmitResult> {
  const user = await requireUser();
  checkId(input.questionId, "Question");
  checkId(input.selectedOptionId, "An answer choice");
  checkMeta(input);
  const now = new Date();

  const question = await db.question.findUnique({
    where: { id: input.questionId },
    select: {
      id: true,
      topicId: true,
      explanation: true,
      topic: { select: { skillId: true } },
      options: { select: { id: true, isCorrect: true } },
    },
  });
  if (!question) throw new Error("Question not found.");
  const picked = question.options.find((o) => o.id === input.selectedOptionId);
  if (!picked) throw new Error("That choice does not belong to this question.");
  const correct = question.options.find((o) => o.isCorrect) ?? null;
  const isCorrect = picked.isCorrect;

  const sessionId = await getOrCreateSession(user.id, question.topic.skillId, now);
  const answer = await db.answer.create({
    data: {
      userId: user.id,
      questionId: question.id,
      sessionId,
      selectedOptionId: picked.id,
      isCorrect,
      confidence: input.confidence,
      usedAi: input.usedAi,
      perceivedDifficulty: input.perceivedDifficulty,
    },
    select: { id: true },
  });

  await syncMasteryAndReview(user.id, question.topicId, question.id, isCorrect, now);
  await maybeCreateMistake({
    userId: user.id,
    topicId: question.topicId,
    questionId: question.id,
    answerId: answer.id,
    note: input.mistakeNote,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${question.id}`);

  return {
    answerId: answer.id,
    isCorrect,
    correctOptionId: correct?.id ?? null,
    explanation: question.explanation,
  };
}

/**
 * Return the explanation for a free-text question. Requires a non-empty
 * written answer, so the answer cannot be revealed before attempting.
 * Nothing is stored yet; the attempt is stored by submitTextSelfMark().
 */
export async function revealTextExplanation(
  input: RevealTextInput,
): Promise<{ explanation: string | null }> {
  await requireUser();
  checkId(input.questionId, "Question");
  if (input.textAnswer.trim().length === 0) {
    throw new Error("Write your answer first, then reveal the explanation.");
  }
  const question = await db.question.findUnique({
    where: { id: input.questionId },
    select: { id: true, explanation: true },
  });
  if (!question) throw new Error("Question not found.");
  return { explanation: question.explanation };
}

/**
 * Store a free-text attempt after the learner compared their answer with
 * the explanation and self-marked correctness.
 */
export async function submitTextSelfMark(input: SubmitTextInput): Promise<SubmitResult> {
  const user = await requireUser();
  checkId(input.questionId, "Question");
  if (input.textAnswer.trim().length === 0) {
    throw new Error("Write your answer first, then submit.");
  }
  checkMeta(input);
  const now = new Date();

  const question = await db.question.findUnique({
    where: { id: input.questionId },
    select: {
      id: true,
      topicId: true,
      explanation: true,
      topic: { select: { skillId: true } },
    },
  });
  if (!question) throw new Error("Question not found.");

  const sessionId = await getOrCreateSession(user.id, question.topic.skillId, now);
  const answer = await db.answer.create({
    data: {
      userId: user.id,
      questionId: question.id,
      sessionId,
      textAnswer: input.textAnswer,
      isCorrect: input.wasCorrect,
      confidence: input.confidence,
      usedAi: input.usedAi,
      perceivedDifficulty: input.perceivedDifficulty,
    },
    select: { id: true },
  });

  await syncMasteryAndReview(user.id, question.topicId, question.id, input.wasCorrect, now);
  await maybeCreateMistake({
    userId: user.id,
    topicId: question.topicId,
    questionId: question.id,
    answerId: answer.id,
    note: input.mistakeNote,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${question.id}`);

  return { answerId: answer.id, isCorrect: input.wasCorrect, correctOptionId: null, explanation: question.explanation };
}
