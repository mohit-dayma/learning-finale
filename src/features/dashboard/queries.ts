// Dashboard data layer (server only).
//
// One async function builds every section of the dashboard:
// today's focus (via the learning engine), reviews, weak areas,
// recent mistakes, and recent progress.
//
// Pages call getDashboardData() and pass plain DTOs to presentational
// components. No database query lives inside a UI component.

import { db } from "@/lib/db";
import {
  aiAssistToScore,
  recommendToday,
  scoreToBand,
  type AiAssistLevel,
  type DailyRecommendation,
  type MasteryBand,
  type TopicSignal,
} from "@/features/learning-engine";

const DAY_MS = 24 * 3600 * 1000;
const RECENT_WINDOW = 10; // attempts used for accuracy / AI dependence
const MISTAKE_WINDOW_DAYS = 14;

export interface FocusQuestion {
  id: string;
  type: string;
  difficulty: string;
}

export interface TodayFocus {
  recommendation: DailyRecommendation;
  question: FocusQuestion | null;
}

export interface ReviewItem {
  id: string;
  dueAt: string; // ISO
  overdueDays: number;
  isOverdue: boolean;
  topicName: string;
  skillName: string;
  questionId: string | null;
  promptSnippet: string | null;
}

export interface ReviewsSummary {
  dueToday: number;
  overdue: number;
  items: ReviewItem[];
}

export interface WeakTopic {
  topicId: string;
  topicSlug: string;
  topicName: string;
  skillName: string;
  masteryScore: number;
  band: MasteryBand;
  attempts: number;
  recentAccuracy: number | null;
}

export interface MistakeItem {
  id: string;
  note: string;
  createdAt: string; // ISO
  topicName: string;
  skillName: string;
  questionId: string | null;
}

export interface SessionItem {
  id: string;
  skillName: string | null;
  status: string;
  startedAt: string; // ISO
  endedAt: string | null; // ISO
  minutes: number | null;
  totalAnswers: number;
  correctAnswers: number;
}

export interface ProgressSummary {
  sessionsLast7Days: number;
  answersLast7Days: number;
  minutesLast7Days: number;
  recentSessions: SessionItem[];
}

export interface DashboardData {
  userName: string;
  focus: TodayFocus | null;
  reviews: ReviewsSummary;
  weakAreas: WeakTopic[];
  mistakes: MistakeItem[];
  progress: ProgressSummary;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function toTopicName(
  topic: { name: string; skill: { name: string } } | null,
  question: {
    prompt?: string;
    topic: { name: string; skill: { name: string } } | null;
  } | null,
): { topicName: string; skillName: string; prompt: string | null } {
  const resolved = topic ?? question?.topic ?? null;
  return {
    topicName: resolved?.name ?? "General",
    skillName: resolved?.skill.name ?? "—",
    prompt: question?.prompt ? truncate(question.prompt, 120) : null,
  };
}

/**
 * Build every dashboard section for one user.
 * All queries filter by userId (authorization). The content catalog
 * (skills/topics/questions) is global and shared by all users.
 */
export async function getDashboardData(
  userId: string,
  userName: string,
  now: Date = new Date(),
): Promise<DashboardData> {
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart.getTime() + DAY_MS);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const mistakeCutoff = new Date(now.getTime() - MISTAKE_WINDOW_DAYS * DAY_MS);

  const [
    topics,
    masteryRows,
    answers,
    reviews,
    mistakes,
    sessions,
    interviewCounts,
    mistakeCounts,
    recentMistakeCounts,
  ] = await Promise.all([
    db.topic.findMany({
      orderBy: [{ skill: { order: "asc" } }, { order: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        skill: { select: { slug: true, name: true } },
      },
    }),
    db.topicMastery.findMany({
      where: { userId },
      select: { topicId: true, score: true, lastStudiedAt: true },
    }),
    db.answer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        isCorrect: true,
        usedAi: true,
        aiAssistLevel: true,
        createdAt: true,
        question: { select: { topicId: true } },
      },
    }),
    db.review.findMany({
      where: { userId, status: "DUE" },
      orderBy: { dueAt: "asc" },
      select: {
        id: true,
        dueAt: true,
        topicId: true,
        questionId: true,
        topic: { select: { name: true, skill: { select: { name: true } } } },
        question: {
          select: {
            prompt: true,
            topic: { select: { name: true, skill: { select: { name: true } } } },
          },
        },
      },
    }),
    db.mistake.findMany({
      where: { userId, isResolved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        note: true,
        createdAt: true,
        questionId: true,
        topic: { select: { name: true, skill: { select: { name: true } } } },
        question: {
          select: {
            topic: { select: { name: true, skill: { select: { name: true } } } },
          },
        },
      },
    }),
    db.learningSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        startedAt: true,
        endedAt: true,
        skill: { select: { name: true } },
        answers: { select: { isCorrect: true } },
      },
    }),
    db.interviewQuestion.groupBy({
      by: ["topicId"],
      _count: { topicId: true },
    }),
    // Unresolved + recent mistake counts need the full per-topic picture,
    // not just the 5 shown above. Grouped here so every dashboard query
    // runs in the same parallel batch.
    db.mistake.groupBy({
      by: ["topicId"],
      where: { userId, isResolved: false },
      _count: { topicId: true },
    }),
    db.mistake.groupBy({
      by: ["topicId"],
      where: { userId, isResolved: false, createdAt: { gte: mistakeCutoff } },
      _count: { topicId: true },
    }),
  ]);

  const masteryByTopic = new Map(masteryRows.map((m) => [m.topicId, m]));
  const interviewByTopic = new Map(
    interviewCounts.map((c) => [c.topicId, c._count.topicId]),
  );

  // Per-topic answer history, newest first (query already orders desc).
  const answersByTopic = new Map<string, typeof answers>();
  for (const answer of answers) {
    const list = answersByTopic.get(answer.question.topicId) ?? [];
    list.push(answer);
    answersByTopic.set(answer.question.topicId, list);
  }

  const dueReviews = reviews.filter((r) => r.dueAt <= now);
  const dueByTopic = new Map<string, typeof dueReviews>();
  for (const review of dueReviews) {
    const topicId = review.topicId ?? null;
    if (!topicId) continue;
    const list = dueByTopic.get(topicId) ?? [];
    list.push(review);
    dueByTopic.set(topicId, list);
  }

  const unresolvedByTopic = new Map<string, number>();
  const recentMistakesByTopic = new Map<string, number>();

  for (const row of mistakeCounts) {
    if (row.topicId) unresolvedByTopic.set(row.topicId, row._count.topicId);
  }
  for (const row of recentMistakeCounts) {
    if (row.topicId) recentMistakesByTopic.set(row.topicId, row._count.topicId);
  }

  const signals: TopicSignal[] = topics.map((topic) => {
    const history = answersByTopic.get(topic.id) ?? [];
    const recent = history.slice(0, RECENT_WINDOW);
    const recentAccuracy =
      recent.length > 0
        ? recent.filter((a) => a.isCorrect).length / recent.length
        : null;
    let streak = 0;
    for (const attempt of history) {
      if (attempt.isCorrect) streak += 1;
      else break;
    }
    // Five-level AI dependence (falls back to the legacy boolean flag
    // for rows written before aiAssistLevel existed).
    const aiScores = recent.map((a) =>
      a.aiAssistLevel != null
        ? aiAssistToScore(a.aiAssistLevel as AiAssistLevel)
        : a.usedAi
          ? aiAssistToScore("ATTEMPTED_THEN_AI")
          : 0,
    );
    const aiDependence =
      aiScores.length > 0 ? aiScores.reduce((n, s) => n + s, 0) / aiScores.length : 0;
    const due = dueByTopic.get(topic.id) ?? [];
    const overdueDays = due.reduce((max, r) => {
      const days = Math.max(
        0,
        Math.floor((now.getTime() - r.dueAt.getTime()) / DAY_MS),
      );
      return Math.max(max, days);
    }, 0);
    const mastery = masteryByTopic.get(topic.id);

    return {
      topicId: topic.id,
      topicSlug: topic.slug,
      topicName: topic.name,
      skillSlug: topic.skill.slug,
      skillName: topic.skill.name,
      masteryScore: mastery?.score ?? 0,
      attempts: history.length,
      recentAccuracy,
      correctStreak: streak,
      dueReviewsCount: due.length,
      overdueDays,
      unresolvedMistakes: unresolvedByTopic.get(topic.id) ?? 0,
      recentMistakeCount: recentMistakesByTopic.get(topic.id) ?? 0,
      aiDependence,
      interviewWeight: (interviewByTopic.get(topic.id) ?? 0) > 0 ? 0.8 : 0.2,
      lastStudiedAt: mastery?.lastStudiedAt ?? history[0]?.createdAt ?? null,
    };
  });

  // --- Today's focus -------------------------------------------------
  const recommendation = recommendToday(signals, now);
  let focus: TodayFocus | null = null;
  if (recommendation) {
    const topicQuestions = await db.question.findMany({
      where: { topicId: recommendation.topicId },
      orderBy: { order: "asc" },
      select: { id: true, type: true, difficulty: true },
    });
    const focusDue = dueReviews.find((r) => {
      if (r.topicId === recommendation.topicId) return true;
      return false;
    });
    let picked: FocusQuestion | null = null;
    if (focusDue?.questionId) {
      const match = topicQuestions.find((q) => q.id === focusDue.questionId);
      if (match)
        picked = { id: match.id, type: match.type, difficulty: match.difficulty };
    }
    if (!picked) {
      const correctIds = new Set(
        (
          await db.answer.findMany({
            where: {
              userId,
              isCorrect: true,
              question: { topicId: recommendation.topicId },
            },
            select: { questionId: true },
          })
        ).map((a) => a.questionId),
      );
      const next =
        topicQuestions.find((q) => !correctIds.has(q.id)) ?? topicQuestions[0];
      if (next) picked = { id: next.id, type: next.type, difficulty: next.difficulty };
    }
    focus = { recommendation, question: picked };
  }

  // --- Reviews --------------------------------------------------------
  const items: ReviewItem[] = reviews
    .filter((r) => r.dueAt <= todayEnd)
    .map((r) => {
      const resolved = toTopicName(r.topic, r.question);
      const overdueDays = Math.max(
        0,
        Math.floor((now.getTime() - r.dueAt.getTime()) / DAY_MS),
      );
      return {
        id: r.id,
        dueAt: r.dueAt.toISOString(),
        overdueDays,
        isOverdue: r.dueAt < todayStart,
        topicName: resolved.topicName,
        skillName: resolved.skillName,
        questionId: r.questionId,
        promptSnippet: resolved.prompt,
      };
    })
    .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || b.overdueDays - a.overdueDays)
    .slice(0, 10);

  const reviewSummary: ReviewsSummary = {
    dueToday: reviews.filter((r) => r.dueAt >= todayStart && r.dueAt <= todayEnd).length,
    overdue: reviews.filter((r) => r.dueAt < todayStart).length,
    items,
  };

  // --- Weak areas ------------------------------------------------------
  const weakAreas: WeakTopic[] = [...signals]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map((s) => ({
      topicId: s.topicId,
      topicSlug: s.topicSlug,
      topicName: s.topicName,
      skillName: s.skillName,
      masteryScore: s.masteryScore,
      band: scoreToBand(s.masteryScore),
      attempts: s.attempts,
      recentAccuracy: s.recentAccuracy,
    }));

  // --- Recent mistakes --------------------------------------------------
  const mistakeItems: MistakeItem[] = mistakes.map((m) => {
    const resolved = toTopicName(m.topic, m.question);
    return {
      id: m.id,
      note: truncate(m.note, 160),
      createdAt: m.createdAt.toISOString(),
      topicName: resolved.topicName,
      skillName: resolved.skillName,
      questionId: m.questionId,
    };
  });

  // --- Progress ----------------------------------------------------------
  const recentSessions: SessionItem[] = sessions.slice(0, 5).map((s) => {
    const totalAnswers = s.answers.length;
    const minutes =
      s.endedAt != null
        ? Math.max(0, Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 60000))
        : null;
    return {
      id: s.id,
      skillName: s.skill?.name ?? null,
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      endedAt: s.endedAt?.toISOString() ?? null,
      minutes,
      totalAnswers,
      correctAnswers: s.answers.filter((a) => a.isCorrect).length,
    };
  });
  const last7 = sessions.filter((s) => s.startedAt >= weekAgo);
  const progress: ProgressSummary = {
    sessionsLast7Days: last7.length,
    answersLast7Days: last7.reduce((n, s) => n + s.answers.length, 0),
    minutesLast7Days: last7.reduce((n, s) => {
      if (!s.endedAt) return n;
      return n + Math.max(0, (s.endedAt.getTime() - s.startedAt.getTime()) / 60000);
    }, 0),
    recentSessions,
  };

  return { userName, focus, reviews: reviewSummary, weakAreas, mistakes: mistakeItems, progress };
}
