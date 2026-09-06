// Interview Mode domain types (pure — no DB, no Next.js).
//
// InterviewSkillCategory is the learner-facing skill picker (10 slugs).
// Some slugs (system-design, ai-engineering, ai-evaluation) may not have
// Skill rows yet; questions for them use topicId null and resolve the
// skill by slug at seed time.

import type {
  Difficulty,
  InterviewCategory,
  InterviewFormat,
} from "@/generated/prisma/enums";

export type InterviewSkillCategory =
  | "javascript"
  | "typescript"
  | "react"
  | "nextjs"
  | "backend"
  | "postgresql"
  | "system-design"
  | "dsa"
  | "ai-engineering"
  | "ai-evaluation";

export const INTERVIEW_SKILL_CATEGORIES: InterviewSkillCategory[] = [
  "javascript",
  "typescript",
  "react",
  "nextjs",
  "backend",
  "postgresql",
  "system-design",
  "dsa",
  "ai-engineering",
  "ai-evaluation",
];

export const INTERVIEW_SKILL_LABELS: Record<InterviewSkillCategory, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  nextjs: "Next.js",
  backend: "Backend",
  postgresql: "PostgreSQL",
  "system-design": "System Design",
  dsa: "DSA",
  "ai-engineering": "AI Engineering",
  "ai-evaluation": "AI Evaluation",
};

/** The 5 supported interview prompt kinds (mirrors Prisma InterviewFormat). */
export type InterviewFormatKind =
  | "TECHNICAL_EXPLANATION"
  | "CODING"
  | "DEBUGGING"
  | "DESIGN"
  | "SCENARIO";

export const INTERVIEW_FORMATS: InterviewFormatKind[] = [
  "TECHNICAL_EXPLANATION",
  "CODING",
  "DEBUGGING",
  "DESIGN",
  "SCENARIO",
];

export const INTERVIEW_FORMAT_LABELS: Record<InterviewFormatKind, string> = {
  TECHNICAL_EXPLANATION: "Explain",
  CODING: "Coding",
  DEBUGGING: "Debugging",
  DESIGN: "Design",
  SCENARIO: "Scenario",
};

/** Per-topic/question selection signals. Topic fields fall back to
 *  defaults (score 0, no history) when a question has no topicId. */
export interface InterviewSignals {
  masteryScore: number;
  attempts: number;
  recentAccuracy: number | null;
  unresolvedMistakes: number;
  recentMistakeCount: number;
  /** 1-5 interview importance of the question. */
  interviewWeight: number;
  lastStudiedAt: Date | null;
}

/** Post-submit feedback. Returned only by the submit action, never
 *  by the queue/detail queries (answers stay hidden before attempting). */
export interface InterviewFeedback {
  expectedAnswer: string | null;
  whatCorrect: string[];
  whatMissed: string[];
  misconceptions: string[];
  followUpPrompt: string | null;
  followUpExpected: string | null;
}

/** One queue entry. Deliberately omits expectedAnswer, keyPoints,
 *  commonMisconceptions, and followUpExpected. */
export interface InterviewQueueItem {
  id: string;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  format: InterviewFormat;
  category: InterviewCategory;
  skillSlug: string | null;
  skillName: string;
  topicName: string | null;
  interviewWeight: number;
  /** Explainable pick reasons: weak area / high importance /
   *  recent mistake / low mastery. */
  whyPicked: string[];
}

export interface InterviewDetail extends InterviewQueueItem {
  attemptCount: number;
  lastWasCorrect: boolean | null;
}
