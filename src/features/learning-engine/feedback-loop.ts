// Feedback loop orchestrator — the full cycle in one place:
//
//   Answer -> Evaluate -> Mastery update -> Review scheduling
//         -> Mistake tracking -> Future recommendation
//
// This module is pure (no DB, no UI, no AI). Server actions in
// features/tasks/actions.ts call it to decide WHAT should happen;
// dashboard queries in features/dashboard/queries.ts read the stored
// rows to decide WHAT TO SHOW. UI components only render the result.
//
// Mastery bands: RED (0-19) < YELLOW (20-49) < GREEN (50-74) <
// BLUE (75-89) < MASTERED (90+, only via canMarkMastered with >= 8
// attempts, >= 85% recent accuracy, no unresolved mistakes, no dues).
// One correct answer moves at most +8 and can never cross 89 -> 90.

import {
  evaluateChoice,
  evaluateSelfMark,
  refineGradeByStreak,
  type Evaluation,
  type ReviewGrade,
} from "./evaluate";
import { updateMasteryScore, scoreToBand, canMarkMastered } from "./mastery";
import { scheduleNextReview, type ReviewPlan } from "./review-schedule";
import {
  averageAiDependence,
  needsIndependentPractice,
  type AiAssistLevel,
} from "./ai-dependence";
import { buildMistakeRecord, type MistakeRecord } from "./mistake-log";
import type { MasteryBand } from "./types";

export interface FeedbackAttempt {
  /** "choice" for MCQ/TRUE_FALSE, "self-mark" for SHORT_ANSWER/CODE. */
  kind: "choice" | "self-mark";
  selectedOptionId?: string;
  correctOptionId?: string | null;
  selfMarkedCorrect?: boolean;
  aiLevel: AiAssistLevel;
  currentScore: number;
  topicAttempts: number;
  correctStreak: number;
  recentAccuracy: number | null;
  unresolvedMistakes: number;
  dueReviewsCount: number;
  recentAiLevels: AiAssistLevel[];
  now: Date;
  /** Snapshot for the mistake log when the answer is wrong. */
  mistakeContext?: {
    question: string;
    userAnswer: string;
    correctAnswer: string | null;
    explanation: string | null;
    whyWrong: string;
    mentalModel: string;
    priorWrongCount: number;
  };
}

export interface FeedbackOutcome {
  evaluation: Evaluation;
  refinedGrade: ReviewGrade;
  nextScore: number;
  band: MasteryBand;
  masteredEligible: boolean;
  masteredReasons: string[];
  reviewPlan: ReviewPlan;
  aiDependence: number;
  forceIndependentPractice: boolean;
  mistake: MistakeRecord | null;
  /** One-line hint for the next recommendation engine. */
  nextStep: string;
}

/** Run the full loop for one attempt. See module header for the order. */
export function processAttempt(attempt: FeedbackAttempt): FeedbackOutcome {
  // 1-2. Answer -> Evaluate (deterministic, no AI).
  const evaluation =
    attempt.kind === "choice"
      ? evaluateChoice({
          selectedOptionId: attempt.selectedOptionId ?? "",
          correctOptionId: attempt.correctOptionId ?? null,
        })
      : evaluateSelfMark({ wasCorrect: attempt.selfMarkedCorrect ?? false });

  // Refine with streak evidence (isolated slip vs chronic failure).
  const refinedGrade = refineGradeByStreak({
    baseGrade: evaluation.grade,
    correctStreak: evaluation.isCorrect ? attempt.correctStreak + 1 : 0,
    recentAccuracy: attempt.recentAccuracy,
  });

  // 3. Mastery update (bounded steps; single answer never grants MASTERED).
  const nextScore = updateMasteryScore({
    currentScore: attempt.currentScore,
    isCorrect: evaluation.isCorrect,
    attempts: attempt.topicAttempts,
  });
  const band = scoreToBand(nextScore);
  const { eligible, reasons } = canMarkMastered({
    score: nextScore,
    attempts: attempt.topicAttempts + 1,
    recentAccuracy: attempt.recentAccuracy,
    unresolvedMistakes: attempt.unresolvedMistakes + (evaluation.isCorrect ? 0 : 1),
    dueReviewsCount: attempt.dueReviewsCount,
  });

  // 4. Review scheduling (1 / 3 / 7 / 14 / 30 days by grade).
  const reviewPlan = scheduleNextReview(refinedGrade, attempt.now);

  // AI dependency: average over recent levels including this attempt.
  const aiDependence = averageAiDependence([...attempt.recentAiLevels, attempt.aiLevel]);
  const forceIndependentPractice = needsIndependentPractice([
    ...attempt.recentAiLevels,
    attempt.aiLevel,
  ]);

  // 5. Mistake tracking (wrong answers only).
  const mistake =
    !evaluation.isCorrect && attempt.mistakeContext
      ? buildMistakeRecord({
          ...attempt.mistakeContext,
          grade: refinedGrade,
          now: attempt.now,
        })
      : null;

  // 6. Future recommendation hint (consumed by recommendToday signals).
  const nextStep = describeNextStep({
    isCorrect: evaluation.isCorrect,
    band,
    forceIndependentPractice,
    hasMistake: mistake !== null,
    grade: refinedGrade,
  });

  return {
    evaluation,
    refinedGrade,
    nextScore,
    band,
    masteredEligible: eligible,
    masteredReasons: reasons,
    reviewPlan,
    aiDependence,
    forceIndependentPractice,
    mistake,
    nextStep,
  };
}

function describeNextStep(args: {
  isCorrect: boolean;
  band: MasteryBand;
  forceIndependentPractice: boolean;
  hasMistake: boolean;
  grade: ReviewGrade;
}): string {
  if (args.forceIndependentPractice) {
    return "High AI dependence: schedule one independent-practice task before new topics.";
  }
  if (args.hasMistake) {
    return `Wrong answer (${args.grade}): review in ${args.grade === "HARD" ? "1 day" : "3 days"}, fix the logged mistake first.`;
  }
  if (!args.isCorrect) return "Wrong answer: review tomorrow, then retry the same topic.";
  if (args.band === "RED" || args.band === "YELLOW") {
    return "Correct but mastery still low: keep practicing this topic.";
  }
  return "Correct: follow the scheduled review and move to the next recommended topic.";
}
