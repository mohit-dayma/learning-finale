import { getDayTheme, getFocusSkills, isOpenDay } from "./rotation";
import { scoreToBand } from "./mastery";
import type {
  DailyRecommendation,
  RecommendationReason,
  ScoreBreakdown,
  TopicSignal,
} from "./types";

const MASTERED_EXCLUSION_PENALTY = -1000;
const MAX_REVIEW_POINTS = 50;
const MAX_MISTAKE_POINTS = 60;

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) return null;
  const ms = now.getTime() - date.getTime();
  return Math.floor(ms / (24 * 3600 * 1000));
}

function masteryPoints(band: string): number {
  switch (band) {
    case "RED":
      return 50;
    case "YELLOW":
      return 30;
    case "GREEN":
      return 15;
    case "BLUE":
      return 5;
    case "MASTERED":
      return MASTERED_EXCLUSION_PENALTY;
    default:
      return 0;
  }
}

function reviewPoints(due: number, overdueDays: number): number {
  if (due <= 0) return 0;
  return Math.min(MAX_REVIEW_POINTS, 30 + Math.min(20, overdueDays * 2));
}

function mistakePoints(unresolved: number, recent: number): number {
  const base = Math.min(36, unresolved * 12);
  const recency = Math.min(24, recent * 8);
  return Math.min(MAX_MISTAKE_POINTS, base + recency);
}

function performancePoints(accuracy: number | null): number {
  if (accuracy === null) return 8;
  if (accuracy < 0.5) return 20;
  if (accuracy < 0.7) return 10;
  if (accuracy > 0.9) return -10;
  return 0;
}

function scoreTopic(topic: TopicSignal, now: Date, inFocus: boolean): ScoreBreakdown {
  const band = scoreToBand(topic.masteryScore);
  const mastery = masteryPoints(band);
  // Mastered topics stay excluded even if other signals fire.
  if (band === "MASTERED") {
    return {
      masteryPoints: mastery,
      reviewPoints: 0,
      mistakePoints: 0,
      performancePoints: 0,
      aiPoints: 0,
      interviewPoints: 0,
      recencyPoints: 0,
      rotationPoints: 0,
      total: mastery,
    };
  }

  const review = reviewPoints(topic.dueReviewsCount, topic.overdueDays);
  const mistake = mistakePoints(topic.unresolvedMistakes, topic.recentMistakeCount);
  const performance = performancePoints(topic.recentAccuracy);
  const ai = topic.aiDependence > 0.6 ? 10 : topic.aiDependence > 0.3 ? 4 : 0;
  const interview = Math.min(15, Math.max(0, topic.interviewWeight) * 15);
  const since = daysSince(topic.lastStudiedAt, now);
  const recency = since === null ? 8 : since > 14 ? 8 : since < 1 ? -5 : 0;
  const rotation = inFocus ? 15 : 0;

  return {
    masteryPoints: mastery,
    reviewPoints: review,
    mistakePoints: mistake,
    performancePoints: performance,
    aiPoints: ai,
    interviewPoints: interview,
    recencyPoints: recency,
    rotationPoints: rotation,
    total: mastery + review + mistake + performance + ai + interview + recency + rotation,
  };
}

function buildReasons(
  topic: TopicSignal,
  band: string,
  score: ScoreBreakdown,
  inFocus: boolean,
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];
  if (band === "RED" || band === "YELLOW") reasons.push("weak-mastery");
  if (topic.dueReviewsCount > 0) reasons.push("due-review");
  if (topic.unresolvedMistakes > 0 || topic.recentMistakeCount > 0)
    reasons.push("recent-mistakes");
  if (topic.recentAccuracy !== null && topic.recentAccuracy < 0.7)
    reasons.push("low-accuracy");
  if (topic.aiDependence > 0.6) reasons.push("ai-dependence");
  if (topic.interviewWeight >= 0.8) reasons.push("interview-important");
  if (inFocus) reasons.push("rotation-focus");
  if (score.recencyPoints > 0) reasons.push("not-studied-recently");
  if (reasons.length === 0) reasons.push("fallback");
  return reasons;
}

function summarize(
  topic: TopicSignal,
  reasons: RecommendationReason[],
  dayName: string,
): string {
  const parts: string[] = [];
  if (reasons.includes("due-review"))
    parts.push(`${topic.dueReviewsCount} due review(s)`);
  if (reasons.includes("weak-mastery")) parts.push("low mastery");
  if (reasons.includes("recent-mistakes"))
    parts.push(`${topic.unresolvedMistakes} unresolved mistake(s)`);
  if (reasons.includes("low-accuracy"))
    parts.push(
      `recent accuracy ${Math.round((topic.recentAccuracy ?? 0) * 100)}%`,
    );
  if (reasons.includes("ai-dependence")) parts.push("high AI dependence");
  if (reasons.includes("interview-important")) parts.push("high interview importance");
  const head = parts.length > 0 ? parts.join(" + ") : "highest need in focus area";
  return `${dayName} focus. ${topic.topicName}: ${head}.`;
}

function buildTask(topic: TopicSignal, reasons: RecommendationReason[]): string {
  if (reasons.includes("due-review"))
    return `Review ${topic.topicName}: redo due flashcards/questions, then explain the concept aloud in 2 minutes.`;
  if (reasons.includes("recent-mistakes"))
    return `Explain ${topic.topicName} and debug a provided example covering your recent mistake.`;
  if (reasons.includes("ai-dependence"))
    return `Solve one ${topic.topicName} exercise without AI help, then compare with an AI solution and note gaps.`;
  if (reasons.includes("interview-important"))
    return `Answer one interview-style ${topic.topicName} question aloud, then write the key points.`;
  if (reasons.includes("weak-mastery"))
    return `Study ${topic.topicName}: read short notes, solve 3 basic problems, write a 3-line summary.`;
  return `Practice ${topic.topicName}: solve 2 problems and write what was hard.`;
}

function estimateMinutes(score: ScoreBreakdown, reasons: RecommendationReason[]): number {
  let minutes = 20;
  if (reasons.includes("due-review")) minutes += 5;
  if (reasons.includes("recent-mistakes")) minutes += 5;
  if (score.masteryPoints >= 50) minutes += 5;
  return Math.min(45, Math.max(15, Math.round(minutes / 5) * 5));
}

/**
 * Deterministic daily recommendation.
 * 1. Filter by weekly rotation (Saturday/Sunday = all skills).
 * 2. Score each eligible topic with an explainable weighted sum.
 * 3. Pick the highest total; ties break by topicSlug (stable).
 * 4. MASTERED topics carry -1000 so they are only picked when nothing else exists.
 * Sunday ignores rotation and leans on due reviews/mistakes everywhere.
 */
export function recommendToday(
  topics: TopicSignal[],
  date: Date,
): DailyRecommendation | null {
  if (topics.length === 0) return null;
  const now = date;
  const theme = getDayTheme(date);
  const focus = getFocusSkills(date);
  const open = isOpenDay(date);

  const eligible = open ? [...topics] : topics.filter((t) => focus.includes(t.skillSlug));
  const pool = eligible.length > 0 ? eligible : [...topics];

  const scored = pool.map((topic) => {
    const inFocus = open ? false : focus.includes(topic.skillSlug);
    // Sunday: rotation does not boost; due/mistake signals decide.
    const score = scoreTopic(topic, now, date.getDay() === 0 ? false : inFocus);
    return { topic, score, inFocus: date.getDay() === 0 ? false : inFocus };
  });

  scored.sort((a, b) => {
    if (b.score.total !== a.score.total) return b.score.total - a.score.total;
    return a.topic.topicSlug.localeCompare(b.topic.topicSlug);
  });

  const winner = scored[0];
  if (!winner) return null;

  const band = scoreToBand(winner.topic.masteryScore);
  const reasons = buildReasons(winner.topic, band, winner.score, winner.inFocus);

  return {
    date: now.toISOString().slice(0, 10),
    dayName: theme.dayName,
    focusSkillSlugs: focus,
    focusLabel: theme.label,
    topicId: winner.topic.topicId,
    topicSlug: winner.topic.topicSlug,
    topicName: winner.topic.topicName,
    skillSlug: winner.topic.skillSlug,
    skillName: winner.topic.skillName,
    masteryBand: band,
    reasons,
    reasonSummary: summarize(winner.topic, reasons, theme.dayName),
    recommendedTask: buildTask(winner.topic, reasons),
    estimatedMinutes: estimateMinutes(winner.score, reasons),
    score: winner.score,
  };
}
