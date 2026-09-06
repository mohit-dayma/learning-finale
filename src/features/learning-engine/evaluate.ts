// Answer evaluation — step 2 of the feedback loop.
//
// Rule: grading is deterministic and explainable. No AI decides
// correctness or mastery. MCQ / TRUE_FALSE compare option IDs.
// SHORT_ANSWER / CODE rely on honest self-marking after the learner
// compares their text with the explanation.
//
// Input: what the learner did.
// Output: isCorrect + a performance grade used for review scheduling.

export type ReviewGrade = "HARD" | "NEEDS_WORK" | "GOOD" | "STRONG" | "MASTERED";

export interface EvaluateChoiceInput {
  selectedOptionId: string;
  correctOptionId: string | null;
}

export interface EvaluateSelfMarkInput {
  wasCorrect: boolean;
}

export interface Evaluation {
  isCorrect: boolean;
  /** Performance grade driving the next review interval. */
  grade: ReviewGrade;
  reason: string;
}

/**
 * Grade a choice-based attempt. Unknown correct option = cannot prove
 * correctness, so it counts as HARD (wrong) to force a 1-day review.
 */
export function evaluateChoice(input: EvaluateChoiceInput): Evaluation {
  if (input.correctOptionId === null) {
    return {
      isCorrect: false,
      grade: "HARD",
      reason: "No correct option stored; treated as needs review.",
    };
  }
  const isCorrect = input.selectedOptionId === input.correctOptionId;
  return {
    isCorrect,
    grade: isCorrect ? "GOOD" : "HARD",
    reason: isCorrect ? "Picked the correct option." : "Picked a wrong option.",
  };
}

/** Trust-but-verify self-mark for free-text answers. */
export function evaluateSelfMark(input: EvaluateSelfMarkInput): Evaluation {
  return {
    isCorrect: input.wasCorrect,
    grade: input.wasCorrect ? "GOOD" : "HARD",
    reason: input.wasCorrect
      ? "Learner marked the answer correct after reading the explanation."
      : "Learner marked the answer wrong after reading the explanation.",
  };
}

/**
 * Refine a base grade with streak evidence. Repeated correct answers
 * lift GOOD -> STRONG; repeated wrong answers keep HARD. A single
 * answer never yields MASTERED — that needs canMarkMastered().
 */
export function refineGradeByStreak(args: {
  baseGrade: ReviewGrade;
  correctStreak: number;
  recentAccuracy: number | null;
}): ReviewGrade {
  if (args.baseGrade === "HARD") {
    // Two failures in the recent window stay HARD; an isolated slip
    // after mostly-correct history is NEEDS_WORK, not a full reset.
    if (args.recentAccuracy !== null && args.recentAccuracy >= 0.7) {
      return "NEEDS_WORK";
    }
    return "HARD";
  }
  if (args.correctStreak >= 4) return "STRONG";
  if (args.correctStreak >= 2) return "GOOD";
  return args.baseGrade;
}
