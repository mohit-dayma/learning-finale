import type { MasteryBand } from "./types";

// Mastery bands (UI-facing):
// RED weak, YELLOW recognize but unreliable, GREEN explain + normal problems,
// BLUE strong, MASTERED deep + unfamiliar situations.
// Score is 0-100 sustained evidence. A single answer never grants MASTERED.

export function scoreToBand(score: number): MasteryBand {
  if (score >= 90) return "MASTERED";
  if (score >= 75) return "BLUE";
  if (score >= 50) return "GREEN";
  if (score >= 20) return "YELLOW";
  return "RED";
}

export interface MasteryUpdateInput {
  currentScore: number;
  isCorrect: boolean;
  attempts: number;
}

export function clampScore(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Bounded score movement so one answer cannot grant mastery.
 * Correct: +6 (plus +2 streak bonus capped at +8 total).
 * Incorrect: -12. New topics start at 0 and must climb gradually.
 * A single correct answer never crosses 89 -> 90; promotion to
 * MASTERED requires sustained evidence via canMarkMastered().
 */
export function updateMasteryScore(input: MasteryUpdateInput): number {
  const { currentScore, isCorrect, attempts } = input;
  if (isCorrect) {
    const streakBonus = attempts > 0 ? 2 : 0;
    const next = clampScore(currentScore + 6 + streakBonus);
    if (currentScore < 90 && next >= 90) return 89;
    return next;
  }
  return clampScore(currentScore - 12);
}

export interface MasteredEligibility {
  eligible: boolean;
  reasons: string[];
}

/**
 * MASTERED requires sustained evidence, never a single answer:
 * score >= 90, >= 8 attempts, recent accuracy >= 0.85,
 * no unresolved mistakes, no due reviews.
 */
export function canMarkMastered(args: {
  score: number;
  attempts: number;
  recentAccuracy: number | null;
  unresolvedMistakes: number;
  dueReviewsCount: number;
}): MasteredEligibility {
  const reasons: string[] = [];
  if (args.score < 90) reasons.push("score below 90");
  if (args.attempts < 8) reasons.push("fewer than 8 attempts");
  if (args.recentAccuracy === null || args.recentAccuracy < 0.85)
    reasons.push("recent accuracy below 85%");
  if (args.unresolvedMistakes > 0) reasons.push("unresolved mistakes remain");
  if (args.dueReviewsCount > 0) reasons.push("due reviews remain");
  return { eligible: reasons.length === 0, reasons };
}
