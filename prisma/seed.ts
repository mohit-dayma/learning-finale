// SkillForge seed — small realistic dataset to verify relationships.
// Run: `pnpm prisma db seed` (configured as `tsx prisma/seed.ts`
// in prisma7.config.ts) or `pnpm db:seed`.
//
// NOTE: Prisma 7 requires a driver adapter even for seeds/migrations.
// The app runtime (src/lib/db.ts) uses the Neon serverless adapter.
// This seed uses a direct `pg` pool (works locally and against Neon's
// DIRECT_URL), which is the recommended pattern for scripts.

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) throw new Error('Missing "DATABASE_URL".');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  // Clean in reverse-FK order so re-seeding is idempotent.
  await db.mistake.deleteMany();
  await db.review.deleteMany();
  await db.answer.deleteMany();
  await db.learningSession.deleteMany();
  await db.studyPlanItem.deleteMany();
  await db.studyPlan.deleteMany();
  await db.careerApplication.deleteMany();
  await db.interviewAttempt.deleteMany();
  await db.interviewQuestion.deleteMany();
  await db.topicMastery.deleteMany();
  await db.questionOption.deleteMany();
  await db.question.deleteMany();
  await db.topic.deleteMany();
  await db.skill.deleteMany();
  await db.user.deleteMany();

  // -- User ---------------------------------------------------------
  const user = await db.user.create({
    data: { email: "demo@skillforge.app", name: "Demo Learner" },
  });

  // -- Skills (11: JS, TS, React, Next.js, DSA, Backend, PG, AI + 3 interview-only) -----
  const skills = await db.skill.createManyAndReturn({
    data: [
      { slug: "javascript", name: "JavaScript", description: "Core JS: scope, closures, async.", order: 1 },
      { slug: "typescript", name: "TypeScript", description: "Types, interfaces, generics, narrowing.", order: 2 },
      { slug: "react", name: "React", description: "Components, hooks, state, rendering.", order: 3 },
      { slug: "nextjs", name: "Next.js", description: "App Router, server components, routing.", order: 4 },
      { slug: "dsa", name: "DSA", description: "Big-O, arrays, lists, stacks.", order: 5 },
      { slug: "backend", name: "Backend", description: "Node.js APIs, REST, auth.", order: 6 },
      { slug: "postgresql", name: "PostgreSQL", description: "SQL, joins, indexes, transactions.", order: 7 },
      { slug: "ai", name: "AI", description: "Prompts, embeddings, RAG basics.", order: 8 },
      { slug: "system-design", name: "System Design", description: "Scale, reliability, trade-offs.", order: 9 },
      { slug: "ai-engineering", name: "AI Engineering", description: "RAG, agents, LLM production.", order: 10 },
      { slug: "ai-evaluation", name: "AI Evaluation", description: "Judges, eval sets, regressions.", order: 11 },
    ],
  });
  const bySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));

  // -- Topics (13: 10 practice + 3 interview-only) ---------------
  const topicRows = [
    { skill: "javascript", slug: "js-closures-scope", name: "Closures and Scope", description: "How closures keep state.", order: 1 },
    { skill: "typescript", slug: "ts-types-narrowing", name: "Types and Narrowing", description: "Model data and narrow unions.", order: 1 },
    { skill: "react", slug: "react-hooks-rendering", name: "Hooks and Rendering", description: "useState, useEffect, memo.", order: 1 },
    { skill: "nextjs", slug: "nextjs-app-router", name: "App Router Basics", description: "Layouts, pages, server components.", order: 1 },
    { skill: "dsa", slug: "dsa-big-o-arrays", name: "Big-O and Arrays", description: "Read cost, two pointers.", order: 1 },
    { skill: "dsa", slug: "dsa-lists-stacks", name: "Lists and Stacks", description: "Linked lists, stacks, queues.", order: 2 },
    { skill: "backend", slug: "backend-rest-node", name: "REST and Node APIs", description: "Status codes and routes.", order: 1 },
    { skill: "postgresql", slug: "pg-joins-indexes", name: "Joins and Indexes", description: "Join tables, speed up queries.", order: 1 },
    { skill: "ai", slug: "ai-prompt-embed", name: "Prompting and Embeddings", description: "Clear prompts and vectors.", order: 1 },
    { skill: "ai", slug: "ai-rag-basics", name: "RAG Basics", description: "Retrieve context, reduce hallucinations.", order: 2 },
    { skill: "system-design", slug: "sys-scale-basics", name: "Scaling Basics", description: "Load, queues, fallbacks.", order: 1 },
    { skill: "ai-engineering", slug: "aieng-rag-prod", name: "RAG in Production", description: "Index, retrieve, generate, control cost.", order: 1 },
    { skill: "ai-evaluation", slug: "aieval-judges", name: "Judges and Eval Sets", description: "Rubrics, agreement, regressions.", order: 1 },
  ];
  const topics = [];
  for (const t of topicRows) {
    topics.push(
      await db.topic.create({
        data: {
          skillId: bySlug[t.skill]!.id,
          slug: t.slug,
          name: t.name,
          description: t.description,
          order: t.order,
        },
      }),
    );
  }
  const topicBySlug = Object.fromEntries(topics.map((t) => [t.slug, t]));

  // -- Questions (12: mix of MCQ + short answer) ----------------------
  type Opt = { label: string; isCorrect: boolean; order: number };
  const mkQuestion = (
    topicSlug: string,
    type: "MULTIPLE_CHOICE" | "SHORT_ANSWER",
    difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    prompt: string,
    explanation: string,
    options: Opt[],
    order: number,
  ) =>
    db.question.create({
      data: {
        topicId: topicBySlug[topicSlug]!.id,
        type,
        difficulty,
        prompt,
        explanation,
        order,
        options: { create: options },
      },
      include: { options: true },
    });

  const q1 = await mkQuestion(
    "js-closures-scope",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What logs? for (var i = 0; i < 3; i++) { setTimeout(() => console.log(i), 0); }",
    "var is function-scoped: the loop ends with i = 3 before callbacks run.",
    [
      { label: "0 1 2", isCorrect: false, order: 1 },
      { label: "3 3 3", isCorrect: true, order: 2 },
      { label: "0 0 0", isCorrect: false, order: 3 },
      { label: "Throws an error", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "js-closures-scope",
    "SHORT_ANSWER",
    "BEGINNER",
    "Fix the loop above so it prints 0 1 2 with a one-word change.",
    "let is block-scoped, so each iteration gets its own i.",
    [],
    2,
  );
  await mkQuestion(
    "ts-types-narrowing",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Given type Pet = Cat | Dog with a shared `kind` field, which narrows correctly?",
    "Check a discriminant literal field; TS narrows the union in that branch.",
    [
      { label: "if (pet.kind === 'cat')", isCorrect: true, order: 1 },
      { label: "if (pet == 'cat')", isCorrect: false, order: 2 },
      { label: "if (typeof pet === 'Cat')", isCorrect: false, order: 3 },
      { label: "if (pet is Cat)", isCorrect: false, order: 4 },
    ],
    1,
  );
  const qReact1 = await mkQuestion(
    "react-hooks-rendering",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Where must you call hooks in React?",
    "React tracks hook call order; branches break it.",
    [
      { label: "Top level of components or custom hooks", isCorrect: true, order: 1 },
      { label: "Inside loops and if blocks", isCorrect: false, order: 2 },
      { label: "Inside plain helper functions", isCorrect: false, order: 3 },
      { label: "Only after an early return", isCorrect: false, order: 4 },
    ],
    1,
  );
  const qReact2 = await mkQuestion(
    "react-hooks-rendering",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "useEffect(() => { fetchData(); }, []) runs when?",
    "Empty deps = run once after first render.",
    [
      { label: "On every render", isCorrect: false, order: 1 },
      { label: "Once after first render", isCorrect: true, order: 2 },
      { label: "Before first render", isCorrect: false, order: 3 },
      { label: "Never", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "nextjs-app-router",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "In the App Router, which component can fetch data directly on the server by default?",
    "Server Components run on the server and can fetch without client JS.",
    [
      { label: "Server Component", isCorrect: true, order: 1 },
      { label: "'use client' component with direct SQL", isCorrect: false, order: 2 },
      { label: "pages/_app.js", isCorrect: false, order: 3 },
      { label: "middleware.ts only", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "dsa-big-o-arrays",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Average time cost of a hash-map lookup?",
    "Constant on average; O(n) worst case.",
    [
      { label: "O(1)", isCorrect: true, order: 1 },
      { label: "O(n)", isCorrect: false, order: 2 },
      { label: "O(log n)", isCorrect: false, order: 3 },
      { label: "O(n^2)", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "dsa-lists-stacks",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Which structure best checks balanced brackets?",
    "Push opens, pop on close; LIFO matches nesting.",
    [
      { label: "Stack", isCorrect: true, order: 1 },
      { label: "Queue", isCorrect: false, order: 2 },
      { label: "Sorted linked list", isCorrect: false, order: 3 },
      { label: "Hash map only", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "backend-rest-node",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Client POSTs valid JSON to /users. Success status?",
    "201 = a new resource was created (send a Location header).",
    [
      { label: "200 OK", isCorrect: false, order: 1 },
      { label: "201 Created", isCorrect: true, order: 2 },
      { label: "204 with a body", isCorrect: false, order: 3 },
      { label: "400 Bad Request", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "pg-joins-indexes",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Need all users plus orders if present. Which JOIN?",
    "LEFT JOIN keeps all left rows; missing right rows are NULL.",
    [
      { label: "INNER JOIN", isCorrect: false, order: 1 },
      { label: "LEFT JOIN", isCorrect: true, order: 2 },
      { label: "CROSS JOIN", isCorrect: false, order: 3 },
      { label: "FULL JOIN with filter", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "ai-prompt-embed",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Which prompt gives the most stable JSON output?",
    "A strict format + 'no extra text' rule cuts parse errors.",
    [
      { label: "Return JSON with keys name and email. No extra text.", isCorrect: true, order: 1 },
      { label: "Tell me about the user.", isCorrect: false, order: 2 },
      { label: "Be creative and surprise me.", isCorrect: false, order: 3 },
      { label: "Write a long story first.", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "ai-rag-basics",
    "SHORT_ANSWER",
    "INTERMEDIATE",
    "In one sentence, what does RAG do?",
    "RAG grounds the model in retrieved context and reduces made-up facts.",
    [],
    1,
  );

  // -- Mastery state ---------------------------------------------------
  await db.topicMastery.create({
    data: {
      userId: user.id,
      topicId: topicBySlug["react-hooks-rendering"]!.id,
      level: "LEARNING",
      score: 50,
    },
  });

  // -- Learning session + answers ---------------------------------------
  const session = await db.learningSession.create({
    data: {
      userId: user.id,
      skillId: bySlug["react"]!.id,
      status: "COMPLETED",
      startedAt: new Date("2026-09-01T09:00:00Z"),
      endedAt: new Date("2026-09-01T09:25:00Z"),
    },
  });

  const correctOpt1 = qReact1.options.find((o) => o.isCorrect)!;
  const wrongOpt2 = qReact2.options.find((o) => !o.isCorrect)!;
  const ans1 = await db.answer.create({
    data: {
      userId: user.id,
      questionId: qReact1.id,
      sessionId: session.id,
      selectedOptionId: correctOpt1.id,
      isCorrect: true,
    },
  });
  const ans2 = await db.answer.create({
    data: {
      userId: user.id,
      questionId: qReact2.id,
      sessionId: session.id,
      selectedOptionId: wrongOpt2.id,
      isCorrect: false,
    },
  });
  void q1;

  // -- Review (due date) --------------------------------------------------
  await db.review.create({
    data: {
      userId: user.id,
      questionId: qReact2.id,
      topicId: topicBySlug["react-hooks-rendering"]!.id,
      dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      status: "DUE",
      intervalDays: 3,
      easeFactor: 2.5,
    },
  });

  // -- Mistake --------------------------------------------------------------
  await db.mistake.create({
    data: {
      userId: user.id,
      questionId: qReact2.id,
      topicId: topicBySlug["react-hooks-rendering"]!.id,
      answerId: ans2.id,
      note: "Mixed up empty deps (mount once) with no array (every render).",
      isResolved: false,
    },
  });
  void ans1;

  // -- Study plan + items ------------------------------------------------------
  const plan = await db.studyPlan.create({
    data: {
      userId: user.id,
      skillId: bySlug["react"]!.id,
      title: "Full-Stack Sprint — 2 weeks",
      description: "Redo weak topics and pass a mock interview.",
      status: "ACTIVE",
      startDate: new Date("2026-09-06"),
      targetDate: new Date("2026-09-20"),
    },
  });
  await db.studyPlanItem.createMany({
    data: [
      {
        studyPlanId: plan.id,
        topicId: topicBySlug["react-hooks-rendering"]!.id,
        title: "Redo Hooks quiz and build a counter",
        status: "PENDING",
        dueDate: new Date("2026-09-08"),
        order: 1,
      },
      {
        studyPlanId: plan.id,
        topicId: topicBySlug["pg-joins-indexes"]!.id,
        title: "Practice 5 JOIN queries",
        status: "PENDING",
        dueDate: new Date("2026-09-10"),
        order: 2,
      },
    ],
  });

  // -- Interview questions (full bank: 10 categories x 5 formats) -----
  // Keep the original React question, then load the shared bank from
  // src/features/interview/seed-data.ts so app + seed never drift.
  await db.interviewQuestion.create({
    data: {
      skillId: bySlug["react"]!.id,
      topicId: topicBySlug["react-hooks-rendering"]!.id,
      title: "Explain re-renders in React",
      prompt: "A list of 1000 rows lags on each keystroke. How do you find the cause and fix it?",
      expectedAnswer: "Check state scope, memo rows, use keys, virtualize the list, memoize the filter.",
      difficulty: "INTERMEDIATE",
      category: "TECHNICAL",
      format: "TECHNICAL_EXPLANATION",
      interviewWeight: 4,
      keyPoints: "Check state scope\nMemo rows\nUse keys\nVirtualize the list\nMemoize the filter",
      commonMisconceptions: "Re-renders always mean slow code\nKeys fix all list problems",
      followUpPrompt: "When would you reach for virtualization over memoization?",
      followUpExpected: "When the list is too large to render all rows even once.",
    },
  });
  const { INTERVIEW_SEED_QUESTIONS } = await import(
    "../src/features/interview/seed-data.js"
  );
  // Null topicSlugs in the bank resolve to the interview-only topics above.
  const fallbackTopic: Record<string, string> = {
    "system-design": "sys-scale-basics",
    "ai-engineering": "aieng-rag-prod",
    "ai-evaluation": "aieval-judges",
  };
  for (const q of INTERVIEW_SEED_QUESTIONS) {
    const skill = bySlug[q.skillSlug];
    if (!skill) throw new Error(`Seed: unknown skill ${q.skillSlug}`);
    const resolvedTopic = q.topicSlug ?? fallbackTopic[q.skillSlug] ?? null;
    await db.interviewQuestion.create({
      data: {
        skillId: skill.id,
        topicId: resolvedTopic ? topicBySlug[resolvedTopic]!.id : null,
        title: q.title,
        prompt: q.prompt,
        expectedAnswer: q.expectedAnswer,
        difficulty: q.difficulty,
        category: q.category,
        format: q.format,
        interviewWeight: q.interviewWeight,
        keyPoints: q.keyPoints,
        commonMisconceptions: q.commonMisconceptions,
        followUpPrompt: q.followUpPrompt,
        followUpExpected: q.followUpExpected,
      },
    });
  }

  // -- Career application ------------------------------------------------------------
  await db.careerApplication.create({
    data: {
      userId: user.id,
      company: "Acme Web",
      role: "Junior Full-Stack Developer",
      status: "APPLIED",
      jobUrl: "https://example.com/jobs/junior-full-stack",
      appliedAt: new Date("2026-09-05T00:00:00Z"),
      notes: "Stack is React, Next.js, Postgres. Referenced SkillForge study plan.",
      skillsRequired: "React, Next.js, PostgreSQL",
      interviewNotes: "Screening call Sep 10: focus on hooks + App Router.",
    },
  });

  const counts = await Promise.all([
    db.skill.count(),
    db.topic.count(),
    db.question.count(),
    db.questionOption.count(),
    db.answer.count(),
    db.review.count(),
    db.mistake.count(),
    db.interviewQuestion.count(),
    db.careerApplication.count(),
  ]);
  console.log(
    `Seed ok — skills=${counts[0]} topics=${counts[1]} questions=${counts[2]} options=${counts[3]} answers=${counts[4]} reviews=${counts[5]} mistakes=${counts[6]} interviews=${counts[7]} applications=${counts[8]}`,
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
