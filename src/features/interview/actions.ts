// Interview submit action (server only, "use server").
//
// The expected answer, key-point breakdown, misconceptions, and follow-up
// leave the server only here, after an attempt has been validated and
// stored. The queue/detail queries (see ./queries.ts) never receive them
// before the attempt.

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  buildMistakeRecord,
  scheduleNextReview,
  updateMasteryScore,
} from "@/features/learning-engine";
import { evaluateInterviewAnswer } from "./select";

const MAX_ANSWER_LENGTH = 5000;

export interface SubmitInterviewAnswerInput {
  questionId: string;
  userAnswer: string;
  /** Honest self-mark, like submitTextSelfMark in tasks/actions.ts. */
  wasCorrect: boolean;
  /** Optional learner notes; the stored breakdown is server-computed. */
  whatCorrect?: string;
  whatMissed?: string;
}

export interface SubmitInterviewAnswerResult {
  attemptId: string;
  isCorrect: boolean;
  /** Auto-check suggestion: keyword hits >= misses. */
  suggestedCorrect: boolean;
  expectedAnswer: string | null;
  whatCorrect: string[];
  whatMissed: string[];
  misconceptions: string[];
  followUpPrompt: string | null;
  followUpExpected: string | null;
}

function checkId(value: string, name: string): void {
  if (!value || value.trim().length === 0) throw new Error(`${name} is required.`);
}

/** Store one interview attempt and feed it back into the learning system. */
export async function submitInterviewAnswer(
  input: SubmitInterviewAnswerInput,
): Promise<SubmitInterviewAnswerResult> {
  const user = await requireUser();
  checkId(input.questionId, "Question");
  const answer = input.userAnswer.trim();
  if (answer.length === 0) {
    throw new Error("Write your answer first, then submit.");
  }
  if (input.userAnswer.length > MAX_ANSWER_LENGTH) {
    throw new Error(`Answer must be under ${MAX_ANSWER_LENGTH} characters.`);
  }
  if (typeof input.wasCorrect !== "boolean") {
    throw new Error("Mark whether you got it right or wrong.");
  }
  for (const [value, name] of [
    [input.whatCorrect, "What was correct"],
    [input.whatMissed, "What was missed"],
  ] as const) {
    if (value !== undefined && value.length > MAX_ANSWER_LENGTH) {
      throw new Error(`${name} must be under ${MAX_ANSWER_LENGTH} characters.`);
    }
  }
  const now = new Date();

  const question = await db.interviewQuestion.findUnique({
    where: { id: input.questionId },
    select: {
      id: true,
      topicId: true,
      prompt: true,
      expectedAnswer: true,
      keyPoints: true,
      commonMisconceptions: true,
      followUpPrompt: true,
      followUpExpected: true,
    },
  });
  if (!question) throw new Error("Question not found.");

  const evaluation = evaluateInterviewAnswer({
    userAnswer: answer,
    keyPoints: question.keyPoints,
    commonMisconceptions: question.commonMisconceptions,
  });
  const suggestedCorrect =
    evaluation.hitPoints.length >= evaluation.missedPoints.length;

  const priorWrong = await db.interviewAttempt.count({
    where: { userId: user.id, questionId: question.id, isCorrect: false },
  });
  const attempt = await db.interviewAttempt.create({
    data: {
      userId: user.id,
      questionId: question.id,
      userAnswer: answer,
      isCorrect: input.wasCorrect,
      whatCorrect: evaluation.hitPoints.join("\n") || null,
      whatMissed: evaluation.missedPoints.join("\n") || null,
    },
    select: { id: true },
  });

  // Feed back into the learning system so dashboard weak areas react.
  if (question.topicId) {
    const topicId = question.topicId;
    const [mastery, topicAttempts] = await Promise.all([
      db.topicMastery.findUnique({
        where: { userId_topicId: { userId: user.id, topicId } },
      }),
      db.interviewAttempt.count({
        where: { userId: user.id, question: { topicId } },
      }),
    ]);
    const nextScore = updateMasteryScore({
      currentScore: mastery?.score ?? 0,
      isCorrect: input.wasCorrect,
      attempts: topicAttempts,
    });
    const level = nextScore >= 50 ? "REVIEWING" : "LEARNING";
    await db.topicMastery.upsert({
      where: { userId_topicId: { userId: user.id, topicId } },
      create: { userId: user.id, topicId, level, score: nextScore, lastStudiedAt: now },
      update: { level, score: nextScore, lastStudiedAt: now },
    });

    // Spaced repetition: GOOD 7d on correct, HARD 1d on wrong.
    // questionId stays null (interview prompts are not practice questions).
    const plan = scheduleNextReview(input.wasCorrect ? "GOOD" : "HARD", now);
    const existingReview = await db.review.findFirst({
      where: { userId: user.id, topicId, questionId: null, status: "DUE" },
      orderBy: { dueAt: "asc" },
    });
    if (existingReview) {
      await db.review.update({
        where: { id: existingReview.id },
        data: {
          grade: plan.grade,
          intervalDays: plan.intervalDays,
          dueAt: plan.dueAt,
          lastReviewedAt: now,
        },
      });
    } else {
      await db.review.create({
        data: {
          userId: user.id,
          topicId,
          questionId: null,
          dueAt: plan.dueAt,
          status: "DUE",
          grade: plan.grade,
          intervalDays: plan.intervalDays,
        },
      });
    }

    if (!input.wasCorrect) {
      const record = buildMistakeRecord({
        question: question.prompt,
        userAnswer: answer,
        correctAnswer: question.expectedAnswer,
        explanation: question.expectedAnswer,
        whyWrong:
          input.whatMissed?.trim() ||
          evaluation.missedPoints.join("\n") ||
          "(no reason given)",
        mentalModel: "(from interview)",
        priorWrongCount: priorWrong,
        grade: "HARD",
        now,
      });
      await db.mistake.create({
        data: {
          userId: user.id,
          topicId,
          questionId: null,
          answerId: null,
          note:
            input.whatMissed?.trim() ||
            "Interview answer missed key points — see feedback.",
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
  }

  revalidatePath("/interview");
  revalidatePath(`/interview/${question.id}`);
  revalidatePath("/dashboard");

  return {
    attemptId: attempt.id,
    isCorrect: input.wasCorrect,
    suggestedCorrect,
    expectedAnswer: question.expectedAnswer,
    whatCorrect: evaluation.hitPoints,
    whatMissed: evaluation.missedPoints,
    misconceptions: evaluation.misconceptions,
    followUpPrompt: question.followUpPrompt,
    followUpExpected: question.followUpExpected,
  };
}
