// AI dependency — who really solved it?
//
// Five recorded levels (stored per answer, shown in the UI as one select):
//   INDEPENDENT       — solved independently
//   HINT              — needed hint
//   ATTEMPTED_THEN_AI — attempted first then used AI
//   AI_MOST           — AI generated most
//   CANNOT_EXPLAIN    — cannot explain
//
// Rule: repeated AI dependency raises the priority of independent
// practice. recommend.ts already adds +10 points when aiDependence > 0.6;
// the helpers here compute that 0-1 score from the five levels.

export type AiAssistLevel =
  | "INDEPENDENT"
  | "HINT"
  | "ATTEMPTED_THEN_AI"
  | "AI_MOST"
  | "CANNOT_EXPLAIN";

export const AI_ASSIST_LEVELS: AiAssistLevel[] = [
  "INDEPENDENT",
  "HINT",
  "ATTEMPTED_THEN_AI",
  "AI_MOST",
  "CANNOT_EXPLAIN",
];

export const AI_ASSIST_LABELS: Record<AiAssistLevel, string> = {
  INDEPENDENT: "Solved independently",
  HINT: "Needed hint",
  ATTEMPTED_THEN_AI: "Attempted first then used AI",
  AI_MOST: "AI generated most",
  CANNOT_EXPLAIN: "Cannot explain",
};

/** Dependence weight per level: 0 = independent, 1 = fully dependent. */
export function aiAssistToScore(level: AiAssistLevel): number {
  switch (level) {
    case "INDEPENDENT":
      return 0;
    case "HINT":
      return 0.3;
    case "ATTEMPTED_THEN_AI":
      return 0.6;
    case "AI_MOST":
      return 0.9;
    case "CANNOT_EXPLAIN":
      return 1;
  }
}

/** Backwards compatible: old boolean flag maps to a level. */
export function usedAiToLevel(usedAi: boolean): AiAssistLevel {
  return usedAi ? "ATTEMPTED_THEN_AI" : "INDEPENDENT";
}

/** True when the legacy checkbox and the new level disagree. */
export function levelMeansAiHelp(level: AiAssistLevel): boolean {
  return level !== "INDEPENDENT";
}

/**
 * Average dependence over recent attempts (0-1). Empty input = 0.
 * Recommend independent practice when this exceeds 0.6.
 */
export function averageAiDependence(levels: AiAssistLevel[]): number {
  if (levels.length === 0) return 0;
  const total = levels.reduce((sum, level) => sum + aiAssistToScore(level), 0);
  return total / levels.length;
}

/** Should the next task force no-AI practice? Rule: avg > 0.6. */
export function needsIndependentPractice(levels: AiAssistLevel[]): boolean {
  return averageAiDependence(levels) > 0.6;
}
