// Learning engine input/output types.
// Pure domain layer: no imports from UI, DB, or Next.js.
// All recommendation inputs are plain data so the logic is testable.

export type MasteryBand = "RED" | "YELLOW" | "GREEN" | "BLUE" | "MASTERED";

export interface TopicSignal {
  topicId: string;
  topicSlug: string;
  topicName: string;
  skillSlug: string;
  skillName: string;
  /** 0-100 sustained score. Never set to 90+ on a single answer. */
  masteryScore: number;
  /** Total answered attempts for this topic. */
  attempts: number;
  /** Accuracy over recent attempts (0-1), null when no history. */
  recentAccuracy: number | null;
  /** Consecutive correct answers, 0 when last was wrong/never. */
  correctStreak: number;
  /** Count of DUE reviews with dueAt <= now. */
  dueReviewsCount: number;
  /** Max days overdue among due reviews, 0 when none due. */
  overdueDays: number;
  /** Unresolved mistake rows for this topic. */
  unresolvedMistakes: number;
  /** Mistakes created in the last 14 days. */
  recentMistakeCount: number;
  /** 0-1 fraction of recent work done with AI help. 1 = fully dependent. */
  aiDependence: number;
  /** 0-1 interview importance for this topic. 1 = frequently asked. */
  interviewWeight: number;
  lastStudiedAt: Date | null;
}

export type RecommendationReason =
  | "weak-mastery"
  | "due-review"
  | "recent-mistakes"
  | "low-accuracy"
  | "ai-dependence"
  | "interview-important"
  | "rotation-focus"
  | "not-studied-recently"
  | "fallback";

export interface ScoreBreakdown {
  masteryPoints: number;
  reviewPoints: number;
  mistakePoints: number;
  performancePoints: number;
  aiPoints: number;
  interviewPoints: number;
  recencyPoints: number;
  rotationPoints: number;
  total: number;
}

export interface DailyRecommendation {
  date: string;
  dayName: string;
  focusSkillSlugs: string[];
  focusLabel: string;
  topicId: string;
  topicSlug: string;
  topicName: string;
  skillSlug: string;
  skillName: string;
  masteryBand: MasteryBand;
  reasons: RecommendationReason[];
  reasonSummary: string;
  recommendedTask: string;
  estimatedMinutes: number;
  score: ScoreBreakdown;
}
