// Interview data layer (server only).
//
// getInterviewQueue() / getInterviewDetail() deliberately omit everything
// the learner must not see before attempting: expectedAnswer, keyPoints,
// commonMisconceptions, and followUpExpected. Those leave the server only
// in the submit action (see ./actions.ts) after an attempt is stored.

import { db } from "@/lib/db";
import {
  buildInterviewSignals,
  pickWeightedRandom,
  weightInterviewQuestion,
  whyPickedFor,
} from "./select";
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_FORMATS,
  INTERVIEW_SKILL_CATEGORIES,
  INTERVIEW_SKILL_LABELS,
} from "./types";
import type {
  InterviewDetail,
  InterviewQueueItem,
  InterviewSignals,
} from "./types";
import type { InterviewFormat } from "@/generated/prisma/enums";

const RECENT_WINDOW = 10; // attempts used for accuracy
const MISTAKE_WINDOW_DAYS = 14;

export interface InterviewCategoryFilter {
  slug: string;
  name: string;
  count: number;
}

export interface InterviewFormatFilter {
  format: InterviewFormat;
  label: string;
  count: number;
}

export interface InterviewFilters {
  categories: InterviewCategoryFilter[];
  formats: InterviewFormatFilter[];
}

export async function getInterviewFilters(): Promise<InterviewFilters> {
  const [bySkill, byFormat] = await Promise.all([
    db.interviewQuestion.groupBy({
      by: ["skillId"],
      _count: { skillId: true },
    }),
    db.interviewQuestion.groupBy({
      by: ["format"],
      _count: { format: true },
    }),
  ]);
  const skillIds = bySkill
    .map((row) => row.skillId)
    .filter((id): id is string => id !== null);
  const skills =
    skillIds.length > 0
      ? await db.skill.findMany({
          where: { id: { in: skillIds } },
          select: { id: true, slug: true },
        })
      : [];
  const slugById = new Map(skills.map((s) => [s.id, s.slug]));
  const countBySlug = new Map<string, number>();
  for (const row of bySkill) {
    if (!row.skillId) continue;
    const slug = slugById.get(row.skillId);
    if (slug) countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + row._count.skillId);
  }
  const countByFormat = new Map(byFormat.map((row) => [row.format, row._count.format]));
  return {
    categories: INTERVIEW_SKILL_CATEGORIES.map((slug) => ({
      slug,
      name: INTERVIEW_SKILL_LABELS[slug],
      count: countBySlug.get(slug) ?? 0,
    })),
    formats: INTERVIEW_FORMATS.map((format) => ({
      format,
      label: INTERVIEW_FORMAT_LABELS[format],
      count: countByFormat.get(format) ?? 0,
    })),
  };
}

interface TopicSignalMaps {
  masteryByTopic: Map<string, { score: number; lastStudiedAt: Date | null }>;
  historyByTopic: Map<string, { isCorrect: boolean; createdAt: Date }[]>;
  unresolvedByTopic: Map<string, number>;
  recentMistakesByTopic: Map<string, number>;
}

/** Per-topic learning signals, mirroring dashboard/queries.ts. */
async function getTopicSignalMaps(
  userId: string,
  topicIds: string[],
  now: Date,
): Promise<TopicSignalMaps> {
  const uniqueIds = [...new Set(topicIds)];
  const [masteryRows, answers, unresolved, recent] = await Promise.all([
    uniqueIds.length > 0
      ? db.topicMastery.findMany({
          where: { userId, topicId: { in: uniqueIds } },
          select: { topicId: true, score: true, lastStudiedAt: true },
        })
      : Promise.resolve([]),
    db.answer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        isCorrect: true,
        createdAt: true,
        question: { select: { topicId: true } },
      },
    }),
    db.mistake.groupBy({
      by: ["topicId"],
      where: { userId, isResolved: false },
      _count: { topicId: true },
    }),
    db.mistake.groupBy({
      by: ["topicId"],
      where: {
        userId,
        isResolved: false,
        createdAt: { gte: new Date(now.getTime() - MISTAKE_WINDOW_DAYS * 24 * 3600 * 1000) },
      },
      _count: { topicId: true },
    }),
  ]);
  const masteryByTopic = new Map(
    masteryRows.map((m) => [m.topicId, { score: m.score, lastStudiedAt: m.lastStudiedAt }]),
  );
  // Query is newest-first, so per-topic lists stay newest-first.
  const historyByTopic = new Map<string, { isCorrect: boolean; createdAt: Date }[]>();
  for (const answer of answers) {
    const list = historyByTopic.get(answer.question.topicId) ?? [];
    list.push({ isCorrect: answer.isCorrect, createdAt: answer.createdAt });
    historyByTopic.set(answer.question.topicId, list);
  }
  const unresolvedByTopic = new Map<string, number>();
  for (const row of unresolved) {
    if (row.topicId) unresolvedByTopic.set(row.topicId, row._count.topicId);
  }
  const recentMistakesByTopic = new Map<string, number>();
  for (const row of recent) {
    if (row.topicId) recentMistakesByTopic.set(row.topicId, row._count.topicId);
  }
  return { masteryByTopic, historyByTopic, unresolvedByTopic, recentMistakesByTopic };
}

function signalsForTopic(
  topicId: string | null,
  interviewWeight: number,
  maps: TopicSignalMaps,
): InterviewSignals {
  if (!topicId) {
    return buildInterviewSignals({ interviewWeight });
  }
  const history = maps.historyByTopic.get(topicId) ?? [];
  const recent = history.slice(0, RECENT_WINDOW);
  const recentAccuracy =
    recent.length > 0
      ? recent.filter((a) => a.isCorrect).length / recent.length
      : null;
  const mastery = maps.masteryByTopic.get(topicId);
  return buildInterviewSignals({
    masteryScore: mastery?.score ?? 0,
    attempts: history.length,
    recentAccuracy,
    unresolvedMistakes: maps.unresolvedByTopic.get(topicId) ?? 0,
    recentMistakeCount: maps.recentMistakesByTopic.get(topicId) ?? 0,
    interviewWeight,
    lastStudiedAt: mastery?.lastStudiedAt ?? history[0]?.createdAt ?? null,
  });
}

export interface InterviewQueueOptions {
  skillSlug?: string;
  format?: InterviewFormat;
  limit?: number;
}

export async function getInterviewQueue(
  userId: string,
  options: InterviewQueueOptions = {},
): Promise<InterviewQueueItem[]> {
  const limit = options.limit ?? 10;
  const questions = await db.interviewQuestion.findMany({
    where: {
      ...(options.skillSlug ? { skill: { slug: options.skillSlug } } : {}),
      ...(options.format ? { format: options.format } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      prompt: true,
      difficulty: true,
      category: true,
      format: true,
      interviewWeight: true,
      topicId: true,
      skill: { select: { slug: true, name: true } },
      topic: { select: { name: true } },
    },
  });
  if (questions.length === 0) return [];
  const maps = await getTopicSignalMaps(
    userId,
    questions.map((q) => q.topicId).filter((id): id is string => id !== null),
    new Date(),
  );
  const scored = questions.map((q) => {
    const signals = signalsForTopic(q.topicId, q.interviewWeight, maps);
    return {
      item: {
        id: q.id,
        title: q.title,
        prompt: q.prompt,
        difficulty: q.difficulty,
        format: q.format,
        category: q.category,
        skillSlug: q.skill?.slug ?? null,
        skillName: q.skill?.name ?? "General",
        topicName: q.topic?.name ?? null,
        interviewWeight: q.interviewWeight,
        whyPicked: whyPickedFor(signals),
      } satisfies InterviewQueueItem,
      score: weightInterviewQuestion(signals),
    };
  });
  return pickWeightedRandom(scored, (s) => s.score, limit).map((s) => s.item);
}

export async function getInterviewDetail(
  userId: string,
  questionId: string,
): Promise<InterviewDetail | null> {
  const [question, attempts] = await Promise.all([
    db.interviewQuestion.findUnique({
      where: { id: questionId },
      // No expectedAnswer, keyPoints, commonMisconceptions, or
      // followUpExpected: the client must not see answers pre-submit.
      select: {
        id: true,
        title: true,
        prompt: true,
        difficulty: true,
        category: true,
        format: true,
        interviewWeight: true,
        topicId: true,
        skill: { select: { slug: true, name: true } },
        topic: { select: { name: true } },
      },
    }),
    db.interviewAttempt.findMany({
      where: { userId, questionId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { isCorrect: true },
    }),
  ]);
  if (!question) return null;
  const maps = await getTopicSignalMaps(
    userId,
    question.topicId ? [question.topicId] : [],
    new Date(),
  );
  const signals = signalsForTopic(question.topicId, question.interviewWeight, maps);
  return {
    id: question.id,
    title: question.title,
    prompt: question.prompt,
    difficulty: question.difficulty,
    format: question.format,
    category: question.category,
    skillSlug: question.skill?.slug ?? null,
    skillName: question.skill?.name ?? "General",
    topicName: question.topic?.name ?? null,
    interviewWeight: question.interviewWeight,
    whyPicked: whyPickedFor(signals),
    attemptCount: attempts.length,
    lastWasCorrect: attempts[0]?.isCorrect ?? null,
  };
}

export interface InterviewSkillStat {
  skillSlug: string;
  skillName: string;
  questions: number;
  attempted: number;
  correct: number;
  rate: number | null;
}

export interface InterviewStats {
  totalQuestions: number;
  attemptedQuestions: number;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number | null;
  perSkill: InterviewSkillStat[];
}

export async function getInterviewStats(userId: string): Promise<InterviewStats> {
  const [questions, attempts] = await Promise.all([
    db.interviewQuestion.findMany({
      select: { id: true, skill: { select: { slug: true, name: true } } },
    }),
    db.interviewAttempt.findMany({
      where: { userId },
      select: { questionId: true, isCorrect: true },
    }),
  ]);
  const attemptsByQuestion = new Map<string, { attempts: number; correct: number }>();
  for (const attempt of attempts) {
    const entry = attemptsByQuestion.get(attempt.questionId) ?? { attempts: 0, correct: 0 };
    entry.attempts += 1;
    if (attempt.isCorrect) entry.correct += 1;
    attemptsByQuestion.set(attempt.questionId, entry);
  }
  const bySkill = new Map<string, InterviewSkillStat>();
  for (const question of questions) {
    const slug = question.skill?.slug ?? "general";
    const stat = bySkill.get(slug) ?? {
      skillSlug: slug,
      skillName: question.skill?.name ?? "General",
      questions: 0,
      attempted: 0,
      correct: 0,
      rate: null,
    };
    stat.questions += 1;
    const qa = attemptsByQuestion.get(question.id);
    if (qa) {
      stat.attempted += qa.attempts;
      stat.correct += qa.correct;
    }
    bySkill.set(slug, stat);
  }
  const perSkill = [...bySkill.values()].map((stat) => ({
    ...stat,
    rate: stat.attempted > 0 ? stat.correct / stat.attempted : null,
  }));
  perSkill.sort((a, b) => b.questions - a.questions);
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  return {
    totalQuestions: questions.length,
    attemptedQuestions: attemptsByQuestion.size,
    totalAttempts,
    correctAttempts,
    correctRate: totalAttempts > 0 ? correctAttempts / totalAttempts : null,
    perSkill,
  };
}
