// Mistake log — step 5 of the feedback loop.
//
// Each wrong answer creates one record with:
//   question, user answer, correct answer, explanation,
//   why the answer was wrong, mental model, date,
//   next review, severity.
//
// Rule: repeated mistakes get higher priority. repeatCount is the number
// of times this question was answered wrong (including this attempt).
// Severity escalates with repeats so recommend.ts and the dashboard
// surface chronic mistakes first.

import { scheduleNextReview } from "./review-schedule";
import type { ReviewGrade } from "./evaluate";

export type MistakeSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface MistakeRecordInput {
  question: string;
  userAnswer: string;
  correctAnswer: string | null;
  explanation: string | null;
  /** Learner note: why was the answer wrong? */
  whyWrong: string;
  /** Learner note: what mental model / rule fixes it? */
  mentalModel: string;
  /** Past wrong attempts for this question (excluding this one). */
  priorWrongCount: number;
  grade: ReviewGrade;
  now: Date;
}

export interface MistakeRecord {
  question: string;
  userAnswer: string;
  correctAnswer: string | null;
  explanation: string | null;
  whyWrong: string;
  mentalModel: string;
  date: Date;
  nextReview: Date;
  severity: MistakeSeverity;
  /** Total wrong attempts including this one. */
  repeatCount: number;
  /** Sort key: higher = fix first. */
  priority: number;
}

/** Escalation ladder: 1st slip LOW, 2nd MEDIUM, 3rd HIGH, 4th+ CRITICAL. */
export function severityForRepeatCount(repeatCount: number): MistakeSeverity {
  if (repeatCount >= 4) return "CRITICAL";
  if (repeatCount === 3) return "HIGH";
  if (repeatCount === 2) return "MEDIUM";
  return "LOW";
}

/** Numeric priority so lists can sort deterministically. */
export function priorityForSeverity(severity: MistakeSeverity): number {
  switch (severity) {
    case "CRITICAL":
      return 40;
    case "HIGH":
      return 30;
    case "MEDIUM":
      return 20;
    case "LOW":
      return 10;
  }
}

/**
 * Build one mistake record. Pure: no DB. The caller persists it and
 * creates a Review due at `nextReview`.
 */
export function buildMistakeRecord(input: MistakeRecordInput): MistakeRecord {
  const repeatCount = Math.max(1, input.priorWrongCount + 1);
  const severity = severityForRepeatCount(repeatCount);
  const { dueAt } = scheduleNextReview(input.grade, input.now);
  return {
    question: input.question,
    userAnswer: input.userAnswer,
    correctAnswer: input.correctAnswer,
    explanation: input.explanation,
    whyWrong: input.whyWrong,
    mentalModel: input.mentalModel,
    date: input.now,
    nextReview: dueAt,
    severity,
    repeatCount,
    priority: priorityForSeverity(severity) + Math.min(9, repeatCount),
  };
}

/** Sort mistakes so repeated / severe ones come first, stable by date. */
export function sortMistakesByPriority(mistakes: MistakeRecord[]): MistakeRecord[] {
  return [...mistakes].sort(
    (a, b) => b.priority - a.priority || a.date.getTime() - b.date.getTime(),
  );
}
