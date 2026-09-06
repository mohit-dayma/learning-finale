// Review scheduling — step 4 of the feedback loop.
//
// Rule table (days until next review):
//   HARD      -> 1 day
//   NEEDS_WORK-> 3 days
//   GOOD      -> 7 days
//   STRONG    -> 14 days
//   MASTERED  -> 30 days
//
// Pure functions only: callers pass `now` explicitly so tests and
// server actions stay deterministic. No DB, no Next.js, no AI.

import type { ReviewGrade } from "./evaluate";

export const REVIEW_INTERVALS_DAYS: Record<ReviewGrade, number> = {
  HARD: 1,
  NEEDS_WORK: 3,
  GOOD: 7,
  STRONG: 14,
  MASTERED: 30,
};

const DAY_MS = 24 * 3600 * 1000;

export interface ReviewPlan {
  grade: ReviewGrade;
  intervalDays: number;
  dueAt: Date;
}

/** Map a grade to its interval. Unknown input falls back to GOOD (7d). */
export function intervalForGrade(grade: ReviewGrade): number {
  return REVIEW_INTERVALS_DAYS[grade] ?? REVIEW_INTERVALS_DAYS.GOOD;
}

/**
 * Plan the next review for one attempt.
 * `now` is the attempt time; dueAt = now + interval days.
 */
export function scheduleNextReview(grade: ReviewGrade, now: Date): ReviewPlan {
  const intervalDays = intervalForGrade(grade);
  return { grade, intervalDays, dueAt: new Date(now.getTime() + intervalDays * DAY_MS) };
}

/** True when a review with this dueAt should appear on the dashboard. */
export function isReviewDue(dueAt: Date, now: Date): boolean {
  return dueAt.getTime() <= now.getTime();
}

/** Whole days overdue (0 when not yet due). Used for priority sorting. */
export function overdueDays(dueAt: Date, now: Date): number {
  if (!isReviewDue(dueAt, now)) return 0;
  return Math.floor((now.getTime() - dueAt.getTime()) / DAY_MS);
}
