// Interview selection + answer evaluation. Pure functions only:
// no DB, no Next.js. All callers pass plain data so the logic is
// deterministic, explainable, and unit-testable.

import type { InterviewSignals } from "./types";

/** Build a signals object from partial inputs (sensible defaults for
 *  questions without topic history). */
export function buildInterviewSignals(
  partial: Partial<InterviewSignals> = {},
): InterviewSignals {
  return {
    masteryScore: 0,
    attempts: 0,
    recentAccuracy: null,
    unresolvedMistakes: 0,
    recentMistakeCount: 0,
    interviewWeight: 3,
    lastStudiedAt: null,
    ...partial,
  };
}

/**
 * Explainable priority score. Weak, mistake-prone, important, and
 * never-studied topics surface first:
 *   (100 - mastery) * 0.4
 *   + min(30, unresolved*10 + recentMistakes*5)
 *   + interviewWeight * 4
 *   + 10 when recent accuracy < 70%
 *   + 5 when never studied.
 */
export function weightInterviewQuestion(signals: InterviewSignals): number {
  const masteryPart = (100 - signals.masteryScore) * 0.4;
  const mistakePart = Math.min(
    30,
    signals.unresolvedMistakes * 10 + signals.recentMistakeCount * 5,
  );
  const importancePart = signals.interviewWeight * 4;
  const accuracyPart =
    signals.recentAccuracy !== null && signals.recentAccuracy < 0.7 ? 10 : 0;
  const neverStudiedPart = signals.lastStudiedAt === null ? 5 : 0;
  return (
    masteryPart + mistakePart + importancePart + accuracyPart + neverStudiedPart
  );
}

/** Human-readable reasons for why a question was picked, derived from
 *  the same signals as the weight (shown in the queue UI). */
export function whyPickedFor(signals: InterviewSignals): string[] {
  const reasons: string[] = [];
  if (signals.masteryScore < 50) reasons.push("weak area");
  if (signals.masteryScore < 20) reasons.push("low mastery");
  if (signals.interviewWeight >= 4) reasons.push("high importance");
  if (signals.unresolvedMistakes > 0 || signals.recentMistakeCount > 0)
    reasons.push("recent mistake");
  return reasons;
}

/**
 * Weighted-random ordering: sort by weight descending with a small
 * random jitter so the queue favors weak/high-importance/recent-mistake
 * items without being fully deterministic. Exported for testing.
 */
export function pickWeightedRandom<T>(
  items: T[],
  getWeight: (item: T) => number,
  limit?: number,
): T[] {
  const decorated = items.map((item) => ({
    item,
    key: getWeight(item) + Math.random() * 10,
  }));
  decorated.sort((a, b) => b.key - a.key);
  const ordered = decorated.map((d) => d.item);
  return typeof limit === "number" ? ordered.slice(0, limit) : ordered;
}

export interface EvaluateInterviewInput {
  userAnswer: string;
  keyPoints: string | null;
  commonMisconceptions: string | null;
}

export interface InterviewEvaluation {
  hitPoints: string[];
  missedPoints: string[];
  /** Misconceptions the answer shows, plus up to 2 missed ones to review. */
  misconceptions: string[];
}

/** Significant words are the content carriers (>= 4 chars, lowercased). */
function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
}

function splitLines(text: string | null): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Keyword-overlap grading: a key point counts as covered when any
 * significant word (>= 4 chars) from the point appears in the answer
 * (case-insensitive). Misconceptions whose keywords appear in the
 * answer are surfaced, plus up to 2 unmatched ones to review.
 */
export function evaluateInterviewAnswer(
  input: EvaluateInterviewInput,
): InterviewEvaluation {
  const answer = input.userAnswer.toLowerCase();
  const hitPoints: string[] = [];
  const missedPoints: string[] = [];
  for (const point of splitLines(input.keyPoints)) {
    const hit = significantWords(point).some((word) => answer.includes(word));
    if (hit) hitPoints.push(point);
    else missedPoints.push(point);
  }
  const matched: string[] = [];
  const unmatched: string[] = [];
  for (const item of splitLines(input.commonMisconceptions)) {
    const shows = significantWords(item).some((word) => answer.includes(word));
    if (shows) matched.push(item);
    else unmatched.push(item);
  }
  return {
    hitPoints,
    missedPoints,
    misconceptions: [...matched, ...unmatched.slice(0, 2)],
  };
}
