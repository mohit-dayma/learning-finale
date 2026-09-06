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
  buildMistakeRecord,
  levelMeansAiHelp,
  processAttempt,
  usedAiToLevel,
  type AiAssistLevel,
} from "@/features/learning-engine";
import type {
  AiAssistLevel as PrismaAiLevel,
  Difficulty,
  MasteryLevel,
} from "@/generated/prisma/enums";

const MAX_NOTE_LENGTH = 1000;
const MAX_TEXT_LENGTH = 5000;

export interface AttemptMeta {
  confidence: number | null; // 1-5, null = not rated
  usedAi: boolean; // legacy checkbox; kept, but aiAssistLevel wins when given
  aiAssistLevel?: AiAssistLevel | null; // five levels; null = derive from usedAi
  canExplain?: boolean | null; // false forces CANNOT_EXPLAIN signal
  perceivedDifficulty: Difficulty | null;
  mistakeNote: string;
  whyWrong?: string;
  mentalModel?: string;
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
  if (
    meta.aiAssistLevel !== undefined &&
    meta.aiAssistLevel !== null &&
    !["INDEPENDENT", "HINT", "ATTEMPTED_THEN_AI", "AI_MOST", "CANNOT_EXPLAIN"].includes(
      meta.aiAssistLevel,
    )
  ) {
    throw new Error("AI assistance level is invalid.");
  }
  for (const field of [meta.whyWrong, meta.mentalModel] as const) {
    if (field !== undefined && field.length > MAX_NOTE_LENGTH) {
      throw new Error(`Mistake fields must be under ${MAX_NOTE_LENGTH} characters.`);
    }
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
 * Resolve the five-level AI signal. Explicit level wins; otherwise fall
 * back to the legacy checkbox. canExplain=false forces CANNOT_EXPLAIN.
 */
function resolveAiLevel(meta: AttemptMeta): AiAssistLevel {
  if (meta.canExplain === false) return "CANNOT_EXPLAIN";
  if (meta.aiAssistLevel) return meta.aiAssistLevel;
  return usedAiToLevel(meta.usedAi);
}

function toPrismaAiLevel(level: AiAssistLevel): PrismaAiLevel {
  return level;
}

/**
 * Move mastery, spaced-repetition, and mistake state forward by one attempt.
 *
 * Flow: Answer -> Evaluate (processAttempt, pure) -> persist mastery,
 * review (1/3/7/14/30d by grade), and rich mistake row. Mastery moves in
 * bounded steps, so a single answer can never grant mastery.
 */
async function syncMasteryAndReview(args: {
  userId: string;
  topicId: string;
  questionId: string;
  kind: "choice" | "self-mark";
  selectedOptionId?: string;
  correctOptionId?: string | null;
  selfMarkedCorrect?: boolean;
  aiLevel: AiAssistLevel;
  now: Date;
  mistakeContext?: {
    question: string;
    userAnswer: string;
    correctAnswer: string | null;
    explanation: string | null;
    whyWrong: string;
    mentalModel: string;
  };
}): Promise<{ isCorrect: boolean; grade: import("@/features/learning-engine").ReviewGrade }> {
  const { userId, topicId, questionId, now } = args;
  const [mastery, topicAnswers, unresolvedMistakes, dueReviews, totalAttempts, priorWrong] =
    await Promise.all([
      db.topicMastery.findUnique({ where: { userId_topicId: { userId, topicId } } }),
      db.answer.findMany({
        where: { userId, question: { topicId } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { isCorrect: true, aiAssistLevel: true },
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
      db.answer.count({ where: { userId, question: { topicId } } }),
      db.answer.count({ where: { userId, questionId, isCorrect: false } }),
    ]);

  let streak = 0;
  for (const attempt of topicAnswers) {
    if (attempt.isCorrect) streak += 1;
    else break;
  }
  const recentAccuracy =
    topicAnswers.length > 0
      ? topicAnswers.filter((a) => a.isCorrect).length / topicAnswers.length
      : null;

  const outcome = processAttempt({
    kind: args.kind,
    selectedOptionId: args.selectedOptionId,
    correctOptionId: args.correctOptionId,
    selfMarkedCorrect: args.selfMarkedCorrect,
    aiLevel: args.aiLevel,
    currentScore: mastery?.score ?? 0,
    topicAttempts: totalAttempts,
    correctStreak: streak,
    recentAccuracy,
    unresolvedMistakes,
    dueReviewsCount: dueReviews,
    recentAiLevels: topicAnswers
      .slice(0, 10)
      .map((a) => (a.aiAssistLevel as AiAssistLevel | null) ?? "INDEPENDENT"),
    now,
    mistakeContext: args.mistakeContext
      ? { ...args.mistakeContext, priorWrongCount: priorWrong }
      : undefined,
  });

  let level: MasteryLevel = "LEARNING";
  if (outcome.masteredEligible) level = "MASTERED";
  else if (totalAttempts === 0) level = "NOT_STARTED";
  else if (outcome.nextScore >= 50) level = "REVIEWING";

  await db.topicMastery.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: { userId, topicId, level, score: outcome.nextScore, lastStudiedAt: now },
    update: { level, score: outcome.nextScore, lastStudiedAt: now },
  });

  // Review scheduling by grade: HARD 1d, NEEDS_WORK 3d, GOOD 7d,
  // STRONG 14d, MASTERED 30d. Due reviews appear on the dashboard.
  const existingReview = await db.review.findFirst({
    where: { userId, questionId, status: "DUE" },
    orderBy: { dueAt: "asc" },
  });
  if (existingReview) {
    await db.review.update({
      where: { id: existingReview.id },
      data: {
        grade: outcome.refinedGrade,
        intervalDays: outcome.reviewPlan.intervalDays,
        dueAt: outcome.reviewPlan.dueAt,
        lastReviewedAt: now,
      },
    });
  } else {
    await db.review.create({
      data: {
        userId,
        questionId,
        topicId,
        dueAt: outcome.reviewPlan.dueAt,
        status: "DUE",
        grade: outcome.refinedGrade,
        intervalDays: outcome.reviewPlan.intervalDays,
      },
    });
  }

  return { isCorrect: outcome.evaluation.isCorrect, grade: outcome.refinedGrade };
}

async function maybeCreateMistake(args: {
  userId: string;
  topicId: string;
  questionId: string;
  answerId: string;
  note: string;
  isCorrect: boolean;
  questionText: string;
  userAnswer: string;
  correctAnswer: string | null;
  explanation: string | null;
  whyWrong: string;
  mentalModel: string;
  grade: import("@/features/learning-engine").ReviewGrade;
  now: Date;
}): Promise<void> {
  // Correct answers leave no mistake row. Wrong answers without any note
  // still leave a row so repeats escalate severity and priority.
  if (args.isCorrect) {
    const note = args.note.trim();
    if (note.length === 0) return;
  }
  const priorWrong = await db.answer.count({
    where: { userId: args.userId, questionId: args.questionId, isCorrect: false },
  });
  // priorWrong includes the just-stored wrong row when isCorrect=false,
  // so subtract it to get the count before this attempt.
  const priorBefore = args.isCorrect ? priorWrong : Math.max(0, priorWrong - 1);
  const record = buildMistakeRecord({
    question: args.questionText,
    userAnswer: args.userAnswer,
    correctAnswer: args.correctAnswer,
    explanation: args.explanation,
    whyWrong: args.whyWrong || args.note.trim() || "(no reason given)",
    mentalModel: args.mentalModel || "(no mental model noted)",
    priorWrongCount: priorBefore,
    grade: args.grade,
    now: args.now,
  });
  await db.mistake.create({
    data: {
      userId: args.userId,
      topicId: args.topicId,
      questionId: args.questionId,
      answerId: args.answerId,
      note: args.note.trim() || args.whyWrong.trim() || "Wrong answer — see linked attempt.",
      questionText: record.question,
      userAnswer: record.userAnswer,
      correctAnswer: record.correctAnswer,
      explanation: record.explanation,
      whyWrong: record.whyWrong,
      mentalModel: record.mentalModel,
      severity: record.severity,
      repeatCount: record.repeatCount,
      nextReviewAt: record.nextReview,
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
      prompt: true,
      explanation: true,
      topic: { select: { skillId: true } },
      options: { select: { id: true, label: true, isCorrect: true } },
    },
  });
  if (!question) throw new Error("Question not found.");
  const picked = question.options.find((o) => o.id === input.selectedOptionId);
  if (!picked) throw new Error("That choice does not belong to this question.");
  const correct = question.options.find((o) => o.isCorrect) ?? null;
  const isCorrect = picked.isCorrect;
  const aiLevel = resolveAiLevel(input);

  const sessionId = await getOrCreateSession(user.id, question.topic.skillId, now);
  const answer = await db.answer.create({
    data: {
      userId: user.id,
      questionId: question.id,
      sessionId,
      selectedOptionId: picked.id,
      isCorrect,
      confidence: input.confidence,
      usedAi: levelMeansAiHelp(aiLevel) || input.usedAi,
      aiAssistLevel: toPrismaAiLevel(aiLevel),
      canExplain: input.canExplain ?? null,
      perceivedDifficulty: input.perceivedDifficulty,
    },
    select: { id: true },
  });

  const { grade } = await syncMasteryAndReview({
    userId: user.id,
    topicId: question.topicId,
    questionId: question.id,
    kind: "choice",
    selectedOptionId: picked.id,
    correctOptionId: correct?.id ?? null,
    aiLevel,
    now,
    mistakeContext: isCorrect
      ? undefined
      : {
          question: question.prompt,
          userAnswer: picked.label,
          correctAnswer: correct?.label ?? null,
          explanation: question.explanation,
          whyWrong: (input.whyWrong ?? "").trim() || input.mistakeNote,
          mentalModel: (input.mentalModel ?? "").trim(),
        },
  });
  await maybeCreateMistake({
    userId: user.id,
    topicId: question.topicId,
    questionId: question.id,
    answerId: answer.id,
    note: input.mistakeNote,
    isCorrect,
    questionText: question.prompt,
    userAnswer: picked.label,
    correctAnswer: correct?.label ?? null,
    explanation: question.explanation,
    whyWrong: (input.whyWrong ?? "").trim(),
    mentalModel: (input.mentalModel ?? "").trim(),
    grade,
    now,
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
  if (input.textAnswer.length > MAX_TEXT_LENGTH) {
    throw new Error(`Answer must be under ${MAX_TEXT_LENGTH} characters.`);
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
  if (input.textAnswer.length > MAX_TEXT_LENGTH) {
    throw new Error(`Answer must be under ${MAX_TEXT_LENGTH} characters.`);
  }
  checkMeta(input);
  const now = new Date();

  const question = await db.question.findUnique({
    where: { id: input.questionId },
    select: {
      id: true,
      topicId: true,
      prompt: true,
      explanation: true,
      topic: { select: { skillId: true } },
    },
  });
  if (!question) throw new Error("Question not found.");
  const aiLevel = resolveAiLevel(input);

  const sessionId = await getOrCreateSession(user.id, question.topic.skillId, now);
  const answer = await db.answer.create({
    data: {
      userId: user.id,
      questionId: question.id,
      sessionId,
      textAnswer: input.textAnswer,
      isCorrect: input.wasCorrect,
      confidence: input.confidence,
      usedAi: levelMeansAiHelp(aiLevel) || input.usedAi,
      aiAssistLevel: toPrismaAiLevel(aiLevel),
      canExplain: input.canExplain ?? null,
      perceivedDifficulty: input.perceivedDifficulty,
    },
    select: { id: true },
  });

  const { grade } = await syncMasteryAndReview({
    userId: user.id,
    topicId: question.topicId,
    questionId: question.id,
    kind: "self-mark",
    selfMarkedCorrect: input.wasCorrect,
    aiLevel,
    now,
    mistakeContext: input.wasCorrect
      ? undefined
      : {
          question: question.prompt,
          userAnswer: input.textAnswer,
          correctAnswer: null,
          explanation: question.explanation,
          whyWrong: (input.whyWrong ?? "").trim() || input.mistakeNote,
          mentalModel: (input.mentalModel ?? "").trim(),
        },
  });
  await maybeCreateMistake({
    userId: user.id,
    topicId: question.topicId,
    questionId: question.id,
    answerId: answer.id,
    note: input.mistakeNote,
    isCorrect: input.wasCorrect,
    questionText: question.prompt,
    userAnswer: input.textAnswer,
    correctAnswer: null,
    explanation: question.explanation,
    whyWrong: (input.whyWrong ?? "").trim(),
    mentalModel: (input.mentalModel ?? "").trim(),
    grade,
    now,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${question.id}`);

  return { answerId: answer.id, isCorrect: input.wasCorrect, correctOptionId: null, explanation: question.explanation };
}
