// Task page data layer (server only).
//
// getTaskData() loads one question as a "task". It deliberately omits
// everything the learner must not see before attempting: which option
// is correct and the explanation. Those are returned only by the
// submit actions in ./actions.ts after an attempt is recorded.

import { db } from "@/lib/db";

export interface TaskOption {
  id: string;
  label: string;
}

export interface TaskData {
  questionId: string;
  type: string;
  difficulty: string;
  prompt: string;
  objective: string;
  estimatedMinutes: number;
  skillName: string;
  skillSlug: string;
  topicName: string;
  topicSlug: string;
  topicDescription: string | null;
  options: TaskOption[];
  hasOptions: boolean;
  attempts: number;
  lastWasCorrect: boolean | null;
  reviewDue: boolean;
}

function objectiveFor(type: string, difficulty: string, topicName: string): string {
  const level =
    difficulty === "BEGINNER"
      ? "Recall the core idea"
      : difficulty === "ADVANCED"
        ? "Apply the idea to an unfamiliar case"
        : "Explain the idea and solve a typical problem";
  const how =
    type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE"
      ? "Choose the correct answer without guessing, then justify your choice."
      : "Write your answer from memory before checking the explanation.";
  return `${level} in ${topicName}. ${how}`;
}

function estimatedMinutesFor(difficulty: string): number {
  if (difficulty === "ADVANCED") return 30;
  if (difficulty === "INTERMEDIATE") return 20;
  return 15;
}

export async function getTaskData(
  userId: string,
  questionId: string,
): Promise<TaskData | null> {
  const [question, attempts, reviewDue] = await Promise.all([
    db.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        type: true,
        difficulty: true,
        prompt: true,
        topic: {
          select: {
            slug: true,
            name: true,
            description: true,
            skill: { select: { slug: true, name: true } },
          },
        },
        options: {
          orderBy: { order: "asc" },
          // No isCorrect, no explanation-adjacent data. The client
          // must not receive anything that reveals the answer.
          select: { id: true, label: true },
        },
      },
    }),
    db.answer.findMany({
      where: { userId, questionId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { isCorrect: true },
    }),
    db.review.findFirst({
      where: { userId, questionId, status: "DUE" },
      select: { id: true },
    }),
  ]);

  if (!question) return null;

  const hasOptions = question.options.length > 0;

  return {
    questionId: question.id,
    type: question.type,
    difficulty: question.difficulty,
    prompt: question.prompt,
    objective: objectiveFor(question.type, question.difficulty, question.topic.name),
    estimatedMinutes: estimatedMinutesFor(question.difficulty),
    skillName: question.topic.skill.name,
    skillSlug: question.topic.skill.slug,
    topicName: question.topic.name,
    topicSlug: question.topic.slug,
    topicDescription: question.topic.description,
    options: question.options,
    hasOptions,
    attempts: attempts.length,
    lastWasCorrect: attempts[0]?.isCorrect ?? null,
    reviewDue: reviewDue !== null,
  };
}
