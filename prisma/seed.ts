// SkillForge seed — realistic dataset to verify relationships.
// Run: `pnpm prisma db seed` (configured as `tsx prisma/seed.ts`
// in prisma7.config.ts) or `pnpm db:seed`.
//
// NOTE: Prisma 7 requires a driver adapter even for seeds/migrations.
// The app runtime (src/lib/db.ts) uses a plain `pg` pool via
// @prisma/adapter-pg (works locally and against Neon, pooled or direct).
// This seed uses the same pattern, which is recommended for scripts.

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

  // -- Skills (14) -----
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
      { slug: "auth-security", name: "Authentication & Security", description: "Passwords, sessions, JWT, OAuth, OWASP basics.", order: 12 },
      { slug: "api-design", name: "API Design", description: "REST conventions, versioning, pagination, idempotency.", order: 13 },
      { slug: "production-engineering", name: "Production Engineering", description: "Observability, CI/CD, envs and secrets, SLOs and error budgets.", order: 14 },
    ],
  });
  const bySlug = Object.fromEntries(skills.map((s) => [s.slug, s]));

  // -- Topics (43) ---------------
  const topicRows = [
    { skill: "javascript", slug: "js-closures-scope", name: "Closures and Scope", description: "How closures keep state.", order: 1 },
    { skill: "javascript", slug: "js-event-loop-async", name: "Event Loop and Async", description: "Microtasks, macrotasks, promises, async/await.", order: 2 },
    { skill: "javascript", slug: "js-this-prototypes-modules", name: "This, Prototypes and Modules", description: "this binding, prototype chain, ES modules.", order: 3 },
    { skill: "typescript", slug: "ts-types-narrowing", name: "Types and Narrowing", description: "Model data and narrow unions.", order: 1 },
    { skill: "typescript", slug: "ts-generics-utility", name: "Generics and Utility Types", description: "Generics, constraints, Partial, Pick, Omit.", order: 2 },
    { skill: "typescript", slug: "ts-strictness", name: "Strictness and Configuration", description: "strict, strictNullChecks, noUncheckedIndexedAccess.", order: 3 },
    { skill: "react", slug: "react-hooks-rendering", name: "Hooks and Rendering", description: "useState, useEffect, memo.", order: 1 },
    { skill: "react", slug: "react-state-effects", name: "State Management and Effects Data Fetching", description: "Local vs shared state, useEffect data fetch, races, cleanup.", order: 2 },
    { skill: "react", slug: "react-performance", name: "React Performance", description: "memo, useMemo, useCallback, keys, virtualization.", order: 3 },
    { skill: "nextjs", slug: "nextjs-app-router", name: "App Router Basics", description: "Layouts, pages, server components.", order: 1 },
    { skill: "nextjs", slug: "nextjs-server-client-caching", name: "Server/Client Boundary, Caching and Revalidation", description: "use client boundary, serializable props, fetch cache, revalidate.", order: 2 },
    { skill: "nextjs", slug: "nextjs-middleware-auth", name: "Middleware and Auth", description: "middleware.ts, edge, route protection, sessions.", order: 3 },
    { skill: "dsa", slug: "dsa-big-o-arrays", name: "Big-O and Arrays", description: "Read cost, two pointers.", order: 1 },
    { skill: "dsa", slug: "dsa-lists-stacks", name: "Lists and Stacks", description: "Linked lists, stacks, queues.", order: 2 },
    { skill: "dsa", slug: "dsa-sorting-search", name: "Sorting, Searching, Hash Maps and Sets", description: "Sort costs, binary search, hash maps and sets for O(1) lookup.", order: 3 },
    { skill: "dsa", slug: "dsa-trees-graphs", name: "Trees and Graphs", description: "BST, BFS, DFS, traversal costs.", order: 4 },
    { skill: "backend", slug: "backend-rest-node", name: "REST and Node APIs", description: "Status codes and routes.", order: 1 },
    { skill: "backend", slug: "backend-middleware-validation", name: "Middleware, Validation and Errors", description: "Express middleware order, zod validation, error handlers.", order: 2 },
    { skill: "backend", slug: "backend-background-jobs", name: "Background Jobs", description: "Queues, retries, idempotent workers.", order: 3 },
    { skill: "postgresql", slug: "pg-joins-indexes", name: "Joins and Indexes", description: "Join tables, speed up queries.", order: 1 },
    { skill: "postgresql", slug: "pg-transactions", name: "Transactions and Isolation", description: "BEGIN/COMMIT, atomicity, isolation levels.", order: 2 },
    { skill: "postgresql", slug: "pg-normalisation-explain", name: "Normalisation and EXPLAIN", description: "1NF-3NF trade-offs, EXPLAIN ANALYZE plans.", order: 3 },
    { skill: "ai", slug: "ai-prompt-embed", name: "Prompting and Embeddings", description: "Clear prompts and vectors.", order: 1 },
    { skill: "ai", slug: "ai-rag-basics", name: "RAG Basics", description: "Retrieve context, reduce hallucinations.", order: 2 },
    { skill: "system-design", slug: "sys-scale-basics", name: "Scaling Basics", description: "Load, queues, fallbacks.", order: 1 },
    { skill: "system-design", slug: "sys-caching-cdn", name: "Caching and CDN", description: "Cache-aside, TTL, CDN, invalidation.", order: 2 },
    { skill: "system-design", slug: "sys-queues", name: "Queues and Async Processing", description: "Decouple work, at-least-once, dead-letter.", order: 3 },
    { skill: "system-design", slug: "sys-cap-load-balancing", name: "CAP and Load Balancing", description: "CAP trade-offs, balancers, health checks.", order: 4 },
    { skill: "ai-engineering", slug: "aieng-rag-prod", name: "RAG in Production", description: "Index, retrieve, generate, control cost.", order: 1 },
    { skill: "ai-engineering", slug: "aieng-chunking-embeddings", name: "Chunking and Embeddings", description: "Chunk size, overlap, hybrid search, rerank.", order: 2 },
    { skill: "ai-engineering", slug: "aieng-agents-cost", name: "Agents, Tools, Cost and Latency", description: "Tool calling loops, guardrails, cost and latency control.", order: 3 },
    { skill: "ai-evaluation", slug: "aieval-judges", name: "Judges and Eval Sets", description: "Rubrics, agreement, regressions.", order: 1 },
    { skill: "ai-evaluation", slug: "aieval-eval-sets-regressions", name: "Eval Sets and Regressions", description: "Frozen sets, seeds, slicing drops, rollbacks.", order: 2 },
    { skill: "ai-evaluation", slug: "aieval-metrics", name: "Metrics and Agreement", description: "Accuracy, precision/recall, kappa agreement.", order: 3 },
    { skill: "auth-security", slug: "auth-password-jwt-sessions", name: "Password Hashing, Sessions and JWT", description: "Hash passwords, compare sessions vs JWT, store tokens safely.", order: 1 },
    { skill: "auth-security", slug: "auth-owasp-basics", name: "OWASP Basics", description: "XSS, CSRF, SQL injection, safe defaults.", order: 2 },
    { skill: "auth-security", slug: "auth-oauth", name: "OAuth and OpenID Connect", description: "Authorization code flow, PKCE, scopes.", order: 3 },
    { skill: "api-design", slug: "api-rest-versioning", name: "REST Conventions and Versioning", description: "Resources, verbs, status codes, API versioning.", order: 1 },
    { skill: "api-design", slug: "api-pagination-filtering", name: "Pagination and Filtering", description: "Offset vs cursor, filter and sort params.", order: 2 },
    { skill: "api-design", slug: "api-idempotency", name: "Idempotency", description: "Safe retries, idempotency keys.", order: 3 },
    { skill: "production-engineering", slug: "prod-observability-logging", name: "Observability and Logging", description: "Logs, metrics, traces, request IDs.", order: 1 },
    { skill: "production-engineering", slug: "prod-cicd-secrets", name: "CI/CD, Envs and Secrets", description: "CI checks, deploys, env config, secret storage.", order: 2 },
    { skill: "production-engineering", slug: "prod-slo-error-budgets", name: "SLOs and Error Budgets", description: "SLIs, SLOs, error budgets, burn response.", order: 3 },
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

  // -- Questions (102: mix of MCQ + TRUE_FALSE + SHORT_ANSWER + CODE) ----------------------
  type Opt = { label: string; isCorrect: boolean; order: number };
  const mkQuestion = (
    topicSlug: string,
    type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE" | "CODE",
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
    "js-closures-scope",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why does this counter keep its own state? function makeCounter() { let n = 0; return () => ++n; } const a = makeCounter();",
    "The returned function closes over n, so each makeCounter call gets fresh private state.",
    [
      { label: "The inner function closes over n from its outer scope", isCorrect: true, order: 1 },
      { label: "n is copied into global scope on each call", isCorrect: false, order: 2 },
      { label: "Arrow functions share one n across all counters", isCorrect: false, order: 3 },
      { label: "n is stored on the prototype", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "js-event-loop-async",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Predict the output: console.log('a'); setTimeout(() => console.log('b'), 0); Promise.resolve().then(() => console.log('c')); console.log('d');",
    "Sync code runs first (a, d), then microtasks (c), then the macrotask (b).",
    [
      { label: "a d c b", isCorrect: true, order: 1 },
      { label: "a b c d", isCorrect: false, order: 2 },
      { label: "a c b d", isCorrect: false, order: 3 },
      { label: "c a d b", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "js-event-loop-async",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "You await three independent fetches one by one in a loop and the page is slow. What is the fastest fix?",
    "Sequential awaits add up latency; Promise.all runs independent work in parallel.",
    [
      { label: "Wrap them in Promise.all so they run in parallel", isCorrect: true, order: 1 },
      { label: "Add more await keywords", isCorrect: false, order: 2 },
      { label: "Use setTimeout between each fetch", isCorrect: false, order: 3 },
      { label: "Switch to synchronous XHR", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "js-event-loop-async",
    "CODE",
    "INTERMEDIATE",
    "Implement sleep(ms) that resolves after ms milliseconds.\n```js\nfunction sleep(ms) {\n  // your code here\n}\n```",
    "Wrap setTimeout in a Promise so callers can await a real delay.",
    [],
    3,
  );
  await mkQuestion(
    "js-this-prototypes-modules",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "const u = { name: 'A', hi() { return this.name; } }; const f = u.hi; What does f() log in strict mode, and why?",
    "this is set by the call site; detached f loses its receiver and this becomes undefined.",
    [
      { label: "undefined (or throws) — this depends on how the function is called", isCorrect: true, order: 1 },
      { label: "'A' always — this is bound where the function is defined", isCorrect: false, order: 2 },
      { label: "The global object always", isCorrect: false, order: 3 },
      { label: "null because hi is a method", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "js-this-prototypes-modules",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "How does `class Dog extends Animal` look up a method that Dog does not define?",
    "Instances delegate up the prototype chain until the method is found or the chain ends.",
    [
      { label: "It walks the prototype chain to Animal.prototype", isCorrect: true, order: 1 },
      { label: "It copies all Animal methods into Dog at import time", isCorrect: false, order: 2 },
      { label: "It re-reads the class file from disk", isCorrect: false, order: 3 },
      { label: "It throws because the method is missing", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "js-this-prototypes-modules",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "When would you use a named ES module export instead of a default export?",
    "Named exports make each binding explicit and tree-shakeable; defaults hide what is imported.",
    [
      { label: "When a module exposes several related helpers you want to tree-shake", isCorrect: true, order: 1 },
      { label: "When you need circular imports to silently work", isCorrect: false, order: 2 },
      { label: "When you want to hide which names are imported", isCorrect: false, order: 3 },
      { label: "When the module has side effects only", isCorrect: false, order: 4 },
    ],
    3,
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
  await mkQuestion(
    "ts-types-narrowing",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why is `unknown` safer than `any` at a JSON parse boundary?",
    "unknown forces you to narrow before use, while any silently disables checking.",
    [
      { label: "unknown must be narrowed before you can use it; any skips checks", isCorrect: true, order: 1 },
      { label: "unknown is faster at runtime", isCorrect: false, order: 2 },
      { label: "any rejects null but unknown accepts it", isCorrect: false, order: 3 },
      { label: "They behave identically", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "ts-types-narrowing",
    "CODE",
    "INTERMEDIATE",
    "Write a type guard isCat(pet: Cat | Dog): pet is Cat using the kind field.\n```ts\ntype Pet = Cat | Dog;\nfunction isCat(pet: Pet): pet is Cat {\n  // your code here\n}\n```",
    "Return a boolean expression on the discriminant; the `pet is Cat` annotation narrows callers.",
    [],
    3,
  );
  await mkQuestion(
    "ts-generics-utility",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What does Partial<User> do, and when would you use it?",
    "It makes every field optional, which fits PATCH bodies and option bags.",
    [
      { label: "Makes all props optional — good for updates and options", isCorrect: true, order: 1 },
      { label: "Makes all props required — good for creation", isCorrect: false, order: 2 },
      { label: "Removes all props from the type", isCorrect: false, order: 3 },
      { label: "Converts the type to any", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "ts-generics-utility",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Compare function first(arr: any[]) vs function first<T>(arr: T[]): T | undefined. Why is the generic better?",
    "The generic preserves the element type into the return, while any erases it.",
    [
      { label: "It keeps the element type so callers get typed results", isCorrect: true, order: 1 },
      { label: "It runs faster at runtime", isCorrect: false, order: 2 },
      { label: "It allows any return type", isCorrect: false, order: 3 },
      { label: "It removes the need for arguments", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "ts-generics-utility",
    "CODE",
    "INTERMEDIATE",
    "Implement pluck that reads one key from each object with full types.\n```ts\nfunction pluck<T, K extends keyof T>(objs: T[], key: K): T[K][] {\n  // your code here\n}\n```",
    "Constrain K to keys of T so the return is inferred as the field type.",
    [],
    3,
  );
  await mkQuestion(
    "ts-strictness",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "With strictNullChecks on, why does const s: string = maybeString fail when maybeString is string | undefined?",
    "strictNullChecks keeps undefined out of string, so you must handle the missing case first.",
    [
      { label: "undefined is not assignable to string until you narrow it away", isCorrect: true, order: 1 },
      { label: "string is deprecated in strict mode", isCorrect: false, order: 2 },
      { label: "const cannot hold strings", isCorrect: false, order: 3 },
      { label: "It only fails at runtime, not compile time", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "ts-strictness",
    "TRUE_FALSE",
    "INTERMEDIATE",
    "With noUncheckedIndexedAccess on, arr[0] on string[] has type string (never undefined). True or False?",
    "Indexed access may be out of bounds, so the flag adds undefined to force a check.",
    [
      { label: "True", isCorrect: false, order: 1 },
      { label: "False", isCorrect: true, order: 2 },
    ],
    2,
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
    "react-hooks-rendering",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "A component reads stale state inside a setTimeout callback. Why does adding the state to the effect deps (or using a ref) fix it?",
    "The closure captured the old render value; re-running the effect or reading a ref gives the current value.",
    [
      { label: "The old closure captured stale state; fresh effect or ref reads current state", isCorrect: true, order: 1 },
      { label: "setTimeout clears state on every render", isCorrect: false, order: 2 },
      { label: "React batches all timeouts into one render", isCorrect: false, order: 3 },
      { label: "State is always async and never readable", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "react-state-effects",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "When would you lift state up instead of keeping it local?",
    "Shared readers need one source of truth; local state would drift between copies.",
    [
      { label: "Two siblings must read and update the same value", isCorrect: true, order: 1 },
      { label: "A single input only its own component uses", isCorrect: false, order: 2 },
      { label: "You want to make renders slower", isCorrect: false, order: 3 },
      { label: "You never want to pass props", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "react-state-effects",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "You fetch on every keystroke and slow responses overwrite fast ones. What fixes the race?",
    "Abort or ignore stale responses so only the latest query updates state.",
    [
      { label: "Abort previous fetch or ignore stale responses by request id", isCorrect: true, order: 1 },
      { label: "Remove the cleanup function", isCorrect: false, order: 2 },
      { label: "Fetch in the render body instead", isCorrect: false, order: 3 },
      { label: "Store results in a global variable", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "react-state-effects",
    "SHORT_ANSWER",
    "INTERMEDIATE",
    "In one sentence, why does setCount(c + 1) inside useEffect with no dep array cause an infinite loop?",
    "Every render re-runs the effect, sets state, and triggers another render.",
    [],
    3,
  );
  await mkQuestion(
    "react-performance",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What does wrapping a row component in React.memo do?",
    "It skips re-rendering when props are shallow-equal, which helps long lists.",
    [
      { label: "Skips re-render when props are unchanged", isCorrect: true, order: 1 },
      { label: "Memoizes the component file on disk", isCorrect: false, order: 2 },
      { label: "Prevents the component ever updating", isCorrect: false, order: 3 },
      { label: "Replaces useState entirely", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "react-performance",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Compare useMemo vs useCallback. When would you use each?",
    "useMemo caches a computed value; useCallback caches a function identity for memoized children.",
    [
      { label: "useMemo for expensive values, useCallback for stable function props", isCorrect: true, order: 1 },
      { label: "They are identical and interchangeable", isCorrect: false, order: 2 },
      { label: "useCallback caches values, useMemo caches components", isCorrect: false, order: 3 },
      { label: "Both replace server caching", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "react-performance",
    "MULTIPLE_CHOICE",
    "ADVANCED",
    "A 10,000-row table still lags after memoizing every row. What is the real fix?",
    "Memo cannot help if all rows mount at once; render only the visible window.",
    [
      { label: "Virtualize the list so only visible rows mount", isCorrect: true, order: 1 },
      { label: "Add more memo wrappers around the same rows", isCorrect: false, order: 2 },
      { label: "Use array index as key everywhere", isCorrect: false, order: 3 },
      { label: "Move all rows into one giant state string", isCorrect: false, order: 4 },
    ],
    3,
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
    "nextjs-app-router",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What is the difference between layout.tsx and page.tsx?",
    "Layouts persist across routes and keep state; pages render the route content.",
    [
      { label: "Layout wraps routes and persists; page is the route UI", isCorrect: true, order: 1 },
      { label: "They are identical file names", isCorrect: false, order: 2 },
      { label: "Layout runs only in the browser", isCorrect: false, order: 3 },
      { label: "Page handles redirects only", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "nextjs-app-router",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why wrap a slow recommendations section in <Suspense fallback={...}>?",
    "Streaming sends fast content first and fills the slow part in without blocking the page.",
    [
      { label: "To stream fast content first and fill slow UI in later", isCorrect: true, order: 1 },
      { label: "To make the slow query run faster", isCorrect: false, order: 2 },
      { label: "To disable server rendering", isCorrect: false, order: 3 },
      { label: "To cache the page forever", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "nextjs-server-client-caching",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What can a Server Component pass to a 'use client' child as props?",
    "Only serializable data crosses the boundary; functions and class instances do not.",
    [
      { label: "Serializable data like plain objects and strings", isCorrect: true, order: 1 },
      { label: "Functions and DB connections", isCorrect: false, order: 2 },
      { label: "Anything including sockets", isCorrect: false, order: 3 },
      { label: "Nothing at all", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "nextjs-server-client-caching",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "When would you use fetch(url, { next: { revalidate: 60 } }) instead of { cache: 'no-store' }?",
    "Revalidate caches for 60s for speed with freshness; no-store always refetches for live data.",
    [
      { label: "For semi-static data where a minute of staleness is fine", isCorrect: true, order: 1 },
      { label: "For per-user live balances that must never be stale", isCorrect: false, order: 2 },
      { label: "To disable all routing", isCorrect: false, order: 3 },
      { label: "To run the fetch in the browser", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "nextjs-server-client-caching",
    "MULTIPLE_CHOICE",
    "ADVANCED",
    "Debug: a 'use client' component imports fs and crashes the build. Why?",
    "Client bundles cannot include server-only Node APIs; move fs reads to a Server Component.",
    [
      { label: "fs is server-only and cannot ship to the browser bundle", isCorrect: true, order: 1 },
      { label: "'use client' disables all imports", isCorrect: false, order: 2 },
      { label: "fs requires a CDN", isCorrect: false, order: 3 },
      { label: "Next.js forbids all npm packages on the client", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "nextjs-middleware-auth",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What does middleware.ts do in Next.js?",
    "It runs on the edge before the route and can rewrite, redirect, or block.",
    [
      { label: "Runs before the request reaches the route; can redirect or rewrite", isCorrect: true, order: 1 },
      { label: "Replaces the database", isCorrect: false, order: 2 },
      { label: "Bundles client JavaScript", isCorrect: false, order: 3 },
      { label: "Only formats code", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "nextjs-middleware-auth",
    "SHORT_ANSWER",
    "INTERMEDIATE",
    "In one sentence, how do you protect /dashboard with middleware and sessions?",
    "Read the session cookie in middleware and redirect to /login when it is missing or invalid.",
    [],
    2,
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
    "dsa-big-o-arrays",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "A sorted array must answer: is there a pair summing to k? Why is two-pointers better than nested loops?",
    "Pointers converge from both ends in one pass (O(n)) instead of checking every pair (O(n^2)).",
    [
      { label: "One O(n) pass vs O(n^2) pair checks", isCorrect: true, order: 1 },
      { label: "It uses less code so it is always correct", isCorrect: false, order: 2 },
      { label: "It sorts the array twice", isCorrect: false, order: 3 },
      { label: "It needs a hash map of size n^2", isCorrect: false, order: 4 },
    ],
    2,
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
    "dsa-lists-stacks",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Compare arrays vs linked lists for inserting at the head. When would you use a linked list?",
    "Linked-list prepend relinks pointers in O(1); arrays shift every element in O(n).",
    [
      { label: "Linked list for frequent head inserts; arrays shift elements", isCorrect: true, order: 1 },
      { label: "Arrays are always O(1) for head inserts", isCorrect: false, order: 2 },
      { label: "Linked lists give O(1) random access", isCorrect: false, order: 3 },
      { label: "They behave identically", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "dsa-sorting-search",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "When would you use binary search, and what does it require?",
    "It halves a sorted range each step for O(log n), but unsorted input gives wrong answers.",
    [
      { label: "Sorted data when you need O(log n) lookups", isCorrect: true, order: 1 },
      { label: "Unsorted data when you need the max", isCorrect: false, order: 2 },
      { label: "Linked lists when you need random access", isCorrect: false, order: 3 },
      { label: "Any data when you need O(1)", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "dsa-sorting-search",
    "CODE",
    "INTERMEDIATE",
    "Implement iterative binary search returning the index or -1.\n```js\nfunction binarySearch(arr, target) {\n  // arr is sorted ascending; your code here\n}\n```",
    "Halve the [lo, hi] window each step for O(log n); a Set would instead give O(1) membership for unsorted dedup.",
    [],
    2,
  );
  await mkQuestion(
    "dsa-trees-graphs",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "When would you use BFS instead of DFS?",
    "BFS expands level by level so the first hit is the shortest path in unweighted graphs.",
    [
      { label: "Shortest path in an unweighted graph", isCorrect: true, order: 1 },
      { label: "Detecting a cycle with least memory always", isCorrect: false, order: 2 },
      { label: "Sorting numbers fastest", isCorrect: false, order: 3 },
      { label: "Hashing passwords", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "dsa-trees-graphs",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why does BST lookup degrade from O(log n) to O(n)?",
    "Unbalanced inserts form a chain, so search walks every node like a list.",
    [
      { label: "Inserts arrive sorted and the tree becomes a chain", isCorrect: true, order: 1 },
      { label: "The tree stores too few nodes", isCorrect: false, order: 2 },
      { label: "Recursion is always O(n)", isCorrect: false, order: 3 },
      { label: "Keys are hashed", isCorrect: false, order: 4 },
    ],
    2,
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
    "backend-rest-node",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Compare PUT vs PATCH for /users/:id. When would you use each?",
    "PUT replaces the whole resource; PATCH applies a partial change.",
    [
      { label: "PUT replaces the resource; PATCH partially updates it", isCorrect: true, order: 1 },
      { label: "PATCH creates; PUT deletes", isCorrect: false, order: 2 },
      { label: "They are identical aliases", isCorrect: false, order: 3 },
      { label: "PUT is for queries only", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "backend-rest-node",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "An async Express 4 handler throws and the request hangs. Why?",
    "Express 4 does not catch rejected promises; you must forward errors to next(err).",
    [
      { label: "Rejected promises are not caught; call next(err)", isCorrect: true, order: 1 },
      { label: "Express retries async handlers forever", isCorrect: false, order: 2 },
      { label: "async makes handlers synchronous", isCorrect: false, order: 3 },
      { label: "The route needs a bigger timeout only", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "backend-middleware-validation",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Why must app.use(express.json()) come before your routes?",
    "Middleware runs in order; routes before the parser see an unparsed body.",
    [
      { label: "Middleware runs in order, so routes need the parsed body first", isCorrect: true, order: 1 },
      { label: "Express sorts middleware alphabetically", isCorrect: false, order: 2 },
      { label: "JSON parsing only works after the response", isCorrect: false, order: 3 },
      { label: "Order never matters", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "backend-middleware-validation",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Where should you validate request bodies with zod, and why?",
    "Validate at the boundary in middleware so handlers only see trusted, typed data.",
    [
      { label: "At the boundary in middleware, before handlers run", isCorrect: true, order: 1 },
      { label: "After writing to the database", isCorrect: false, order: 2 },
      { label: "Only in the frontend", isCorrect: false, order: 3 },
      { label: "Never — validation slows APIs", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "backend-middleware-validation",
    "CODE",
    "INTERMEDIATE",
    "Write an Express error middleware that returns JSON with the error status.\n```js\nfunction errorHandler(err, req, res, next) {\n  // your code here\n}\n```",
    "Error middleware has four args and must send a status plus JSON instead of crashing.",
    [],
    3,
  );
  await mkQuestion(
    "backend-background-jobs",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "When would you move welcome-email sending into a background job?",
    "Slow, retryable side effects should not block the HTTP response.",
    [
      { label: "When the work is slow and can retry outside the request", isCorrect: true, order: 1 },
      { label: "When the work must finish before responding always", isCorrect: false, order: 2 },
      { label: "When the task takes under 1ms", isCorrect: false, order: 3 },
      { label: "Never — jobs are always slower", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "backend-background-jobs",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "A worker processes the same email job twice after a retry. How do you prevent double sends?",
    "At-least-once delivery means consumers must be idempotent, using keys or dedup checks.",
    [
      { label: "Make the handler idempotent with a dedup key", isCorrect: true, order: 1 },
      { label: "Disable all retries", isCorrect: false, order: 2 },
      { label: "Run two workers on the same job", isCorrect: false, order: 3 },
      { label: "Delete the queue", isCorrect: false, order: 4 },
    ],
    2,
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
    "pg-joins-indexes",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Why does an index on users(email) speed up WHERE email = 'a@x.com'?",
    "A btree finds the key without scanning every row.",
    [
      { label: "It looks up the key directly instead of scanning all rows", isCorrect: true, order: 1 },
      { label: "It compresses the whole table", isCorrect: false, order: 2 },
      { label: "It moves the table to memory only", isCorrect: false, order: 3 },
      { label: "It rewrites SQL automatically", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "pg-joins-indexes",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "You query WHERE a = 1 AND b = 2 often. Which composite index helps both that and WHERE a = 1?",
    "A leftmost-prefix (a, b) index serves a-only and (a, b) queries, but not b-only.",
    [
      { label: "INDEX ON t (a, b)", isCorrect: true, order: 1 },
      { label: "INDEX ON t (b) only", isCorrect: false, order: 2 },
      { label: "INDEX ON t (b, a) for a-only queries", isCorrect: false, order: 3 },
      { label: "No index can help two columns", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "pg-transactions",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What does wrapping two INSERTs in BEGIN/COMMIT guarantee?",
    "Atomicity: either both rows commit or neither does.",
    [
      { label: "Both succeed or both roll back (atomicity)", isCorrect: true, order: 1 },
      { label: "They run faster on all hardware", isCorrect: false, order: 2 },
      { label: "Other users cannot read the table ever", isCorrect: false, order: 3 },
      { label: "The rows bypass constraints", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "pg-transactions",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Two users book the last seat at once and both succeed. What went wrong?",
    "Separate reads both saw one seat left; a transaction with SELECT FOR UPDATE serializes the check.",
    [
      { label: "No transaction isolated the read-check-write sequence", isCorrect: true, order: 1 },
      { label: "The table needs more indexes", isCorrect: false, order: 2 },
      { label: "Postgres cannot handle two users", isCorrect: false, order: 3 },
      { label: "Seats should be stored in the frontend", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "pg-transactions",
    "MULTIPLE_CHOICE",
    "ADVANCED",
    "When would you use SERIALIZABLE instead of READ COMMITTED?",
    "Serializable prevents phantom and write-skew anomalies when concurrent writes must look sequential.",
    [
      { label: "When concurrent money or inventory writes must not skew", isCorrect: true, order: 1 },
      { label: "When you want more anomalies", isCorrect: false, order: 2 },
      { label: "When queries must run without locks ever", isCorrect: false, order: 3 },
      { label: "When the table is empty", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "pg-normalisation-explain",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Compare normalized vs denormalized orders. When would you denormalize?",
    "Normalization removes duplication and anomalies; denormalize for read-heavy reports that join too much.",
    [
      { label: "Denormalize for heavy reads; normalize to avoid duplicate-update bugs", isCorrect: true, order: 1 },
      { label: "Always denormalize everything", isCorrect: false, order: 2 },
      { label: "Normalization slows all writes to zero", isCorrect: false, order: 3 },
      { label: "They are the same thing", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "pg-normalisation-explain",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "EXPLAIN ANALYZE shows Seq Scan on a 10M-row table with high actual time. What do you do first?",
    "A sequential scan on a huge filtered table usually means a missing or unusable index.",
    [
      { label: "Check the filter column for a missing or blocked index", isCorrect: true, order: 1 },
      { label: "Add SELECT * to more queries", isCorrect: false, order: 2 },
      { label: "Delete the table statistics", isCorrect: false, order: 3 },
      { label: "Ignore actual time; cost is enough", isCorrect: false, order: 4 },
    ],
    2,
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
    "ai-prompt-embed",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why does cosine similarity over embeddings power semantic search?",
    "Embeddings place similar meanings near each other, so angle measures meaning overlap beyond keywords.",
    [
      { label: "Nearby vectors share meaning, so angle finds related docs", isCorrect: true, order: 1 },
      { label: "Cosine counts exact keyword matches", isCorrect: false, order: 2 },
      { label: "Embeddings store the full document text", isCorrect: false, order: 3 },
      { label: "Similarity requires identical strings", isCorrect: false, order: 4 },
    ],
    2,
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
  await mkQuestion(
    "ai-rag-basics",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Why does RAG reduce hallucinations on private docs?",
    "Retrieved passages ground the answer in real sources instead of pure memory.",
    [
      { label: "The model quotes retrieved context instead of guessing", isCorrect: true, order: 1 },
      { label: "RAG makes the model larger", isCorrect: false, order: 2 },
      { label: "RAG disables the model weights", isCorrect: false, order: 3 },
      { label: "RAG removes the need for prompts", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "sys-scale-basics",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Compare vertical vs horizontal scaling. When would you use horizontal?",
    "Horizontal adds more machines for fault tolerance and elastic load; vertical just buys a bigger box.",
    [
      { label: "Add machines for elastic traffic and failover", isCorrect: true, order: 1 },
      { label: "Always buy one bigger server for infinite scale", isCorrect: false, order: 2 },
      { label: "Horizontal means bigger CPUs only", isCorrect: false, order: 3 },
      { label: "Scaling never needs load balancing", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "sys-scale-basics",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "An instance dies at peak. Why do users see nothing?",
    "The balancer health-checks and routes only to healthy instances.",
    [
      { label: "Health checks remove it and traffic shifts to healthy nodes", isCorrect: true, order: 1 },
      { label: "Dead instances keep serving from disk", isCorrect: false, order: 2 },
      { label: "Users retry until the dead box reboots", isCorrect: false, order: 3 },
      { label: "DNS caches the failure forever", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "sys-caching-cdn",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "When would you put product images on a CDN instead of your API servers?",
    "Static, cacheable bytes belong near users; dynamic API logic stays on your servers.",
    [
      { label: "Static cacheable assets requested worldwide", isCorrect: true, order: 1 },
      { label: "Live per-user balances", isCorrect: false, order: 2 },
      { label: "Secrets and private keys", isCorrect: false, order: 3 },
      { label: "Uncacheable POST writes", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "sys-caching-cdn",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Your cache expires and 1000 requests stampede the DB at once. What prevents it?",
    "Serve stale while revalidating once, or add jitter and request coalescing.",
    [
      { label: "Stale-while-revalidate plus single-flight rebuild", isCorrect: true, order: 1 },
      { label: "Shorter TTLs with no other change", isCorrect: false, order: 2 },
      { label: "More cache keys for the same data", isCorrect: false, order: 3 },
      { label: "Disable the cache entirely", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "sys-queues",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "When would you use a queue for image uploads?",
    "Slow resizes should ack fast and process async with retries.",
    [
      { label: "Resize work is slow and retryable outside the request", isCorrect: true, order: 1 },
      { label: "When uploads must block the response for minutes", isCorrect: false, order: 2 },
      { label: "When order never matters and loss is fine always", isCorrect: false, order: 3 },
      { label: "Queues replace the database", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "sys-queues",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "A queue delivers some messages twice. How do you stay correct?",
    "Assume at-least-once and make consumers idempotent with dedup keys and dead-letter for poison messages.",
    [
      { label: "Idempotent consumers plus dedup keys and dead-letter queue", isCorrect: true, order: 1 },
      { label: "Assume exactly-once is free", isCorrect: false, order: 2 },
      { label: "Process without acking", isCorrect: false, order: 3 },
      { label: "Retry forever with no backoff", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "sys-cap-load-balancing",
    "TRUE_FALSE",
    "BEGINNER",
    "During a network partition, a distributed store can be fully consistent, available, and partition-tolerant all at once. True or False?",
    "CAP forces a choice between consistency and availability while partitioned.",
    [
      { label: "True", isCorrect: false, order: 1 },
      { label: "False", isCorrect: true, order: 2 },
    ],
    1,
  );
  await mkQuestion(
    "sys-cap-load-balancing",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "When would you use least-connections over round-robin, and when do sticky sessions help?",
    "Least-connections balances uneven work; stickiness keeps stateful sessions on one node.",
    [
      { label: "Uneven request costs need least-connections; stateful sessions need stickiness", isCorrect: true, order: 1 },
      { label: "Round-robin always balances uneven loads best", isCorrect: false, order: 2 },
      { label: "Sticky sessions replace health checks", isCorrect: false, order: 3 },
      { label: "Balancers remove the need for replicas", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "aieng-rag-prod",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Why chunk a 50-page PDF into 500-token pieces with overlap instead of embedding it whole?",
    "Small focused chunks retrieve precisely; overlap preserves context cut at boundaries.",
    [
      { label: "Small chunks pinpoint answers and overlap keeps split context", isCorrect: true, order: 1 },
      { label: "Whole docs always retrieve better", isCorrect: false, order: 2 },
      { label: "Overlap wastes embeddings with no benefit", isCorrect: false, order: 3 },
      { label: "Chunking removes the need for search", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "aieng-rag-prod",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "How do you know RAG helped instead of hurting?",
    "Compare grounded answers on a test set for faithfulness and relevance before and after.",
    [
      { label: "Measure faithfulness and relevance on a fixed test set", isCorrect: true, order: 1 },
      { label: "Count total tokens used", isCorrect: false, order: 2 },
      { label: "Ask the model if it feels better", isCorrect: false, order: 3 },
      { label: "Ship without measuring", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "aieng-chunking-embeddings",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What is chunk overlap for in RAG indexing?",
    "It keeps sentences split across chunks understandable in both pieces.",
    [
      { label: "Preserve context that straddles chunk boundaries", isCorrect: true, order: 1 },
      { label: "Double the vector dimension", isCorrect: false, order: 2 },
      { label: "Encrypt the chunks", isCorrect: false, order: 3 },
      { label: "Replace metadata filters", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "aieng-chunking-embeddings",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "When would you use hybrid search plus reranking over pure vector search?",
    "Keyword plus vector covers exact IDs and meaning; rerankers reorder top-k by true relevance.",
    [
      { label: "Queries mix exact codes and fuzzy meaning, and top-k needs reordering", isCorrect: true, order: 1 },
      { label: "You never need exact matches", isCorrect: false, order: 2 },
      { label: "Reranking replaces chunking", isCorrect: false, order: 3 },
      { label: "Vectors already handle SKUs perfectly", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "aieng-agents-cost",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What is the agent loop with tools?",
    "The model plans, calls a tool, reads the result, and repeats until done.",
    [
      { label: "Plan, call tool, observe result, repeat until the task is done", isCorrect: true, order: 1 },
      { label: "Call every tool once in parallel always", isCorrect: false, order: 2 },
      { label: "Answer without ever observing tools", isCorrect: false, order: 3 },
      { label: "Tools replace the model", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "aieng-agents-cost",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Your support bot bill tripled from long histories and verbose answers. What cuts cost without hurting quality?",
    "Shorten context, cap output, cache repeats, and route easy queries to a smaller model behind an eval set.",
    [
      { label: "Summarize history, cap tokens, cache, route easy chats cheaper", isCorrect: true, order: 1 },
      { label: "Send full history every turn with max tokens", isCorrect: false, order: 2 },
      { label: "Disable caching for freshness always", isCorrect: false, order: 3 },
      { label: "Use the largest model for every hello", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "aieval-judges",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What makes an LLM-as-judge setup trustworthy?",
    "A rubric with examples, blind randomized order, and agreement checks tame bias.",
    [
      { label: "Rubric plus blind order plus agreement checks", isCorrect: true, order: 1 },
      { label: "One judge score with no rubric", isCorrect: false, order: 2 },
      { label: "Grading your own model outputs only", isCorrect: false, order: 3 },
      { label: "Longer answers always win", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "aieval-judges",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Which judge biases must you watch for, and how do you reduce them?",
    "Position, verbosity, and self-preference skew scores; randomize, blind, and use multiple judges.",
    [
      { label: "Position/verbosity/self-preference; randomize and blind with several judges", isCorrect: true, order: 1 },
      { label: "Judges have no biases", isCorrect: false, order: 2 },
      { label: "Always grade longer answers higher", isCorrect: false, order: 3 },
      { label: "Show model names to judges", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "aieval-eval-sets-regressions",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What is an eval set?",
    "Frozen inputs with expected outputs or rubrics that you rerun on every change.",
    [
      { label: "Fixed inputs plus expected answers rerun on each change", isCorrect: true, order: 1 },
      { label: "Random live traffic you never store", isCorrect: false, order: 2 },
      { label: "Only the training data", isCorrect: false, order: 3 },
      { label: "A list of model prices", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "aieval-eval-sets-regressions",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Weekly evals drop 8 points after a prompt change. How do you decide on rollback?",
    "Slice failures, reproduce on frozen seed, diff noise from real drops, and roll back key slices that stay red.",
    [
      { label: "Slice, reproduce on fixed seed, diff outputs, roll back red slices", isCorrect: true, order: 1 },
      { label: "Trust one aggregate number and ship anyway", isCorrect: false, order: 2 },
      { label: "Delete the eval set", isCorrect: false, order: 3 },
      { label: "Roll forward without checking slices", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "aieval-metrics",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "When would accuracy mislead and precision/recall help?",
    "On imbalanced data a dumb majority classifier scores high accuracy while missing the rare class.",
    [
      { label: "Imbalanced classes where the rare case matters most", isCorrect: true, order: 1 },
      { label: "Perfectly balanced classes always", isCorrect: false, order: 2 },
      { label: "When you have no labels", isCorrect: false, order: 3 },
      { label: "Metrics never matter", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "aieval-metrics",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why measure judge-human agreement (e.g. kappa) before trusting judge scores?",
    "Low agreement means the rubric or judge is noisy and scores cannot guide releases.",
    [
      { label: "Low agreement shows scores are noise, not signal", isCorrect: true, order: 1 },
      { label: "Agreement makes scores slower only", isCorrect: false, order: 2 },
      { label: "Humans are never needed", isCorrect: false, order: 3 },
      { label: "Kappa replaces the rubric", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "auth-password-jwt-sessions",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "How should you store user passwords?",
    "Slow salted hashes (bcrypt/scrypt/argon2) resist cracking; never store plaintext or fast hashes alone.",
    [
      { label: "Salted slow hash like bcrypt or argon2", isCorrect: true, order: 1 },
      { label: "Plaintext for easy recovery", isCorrect: false, order: 2 },
      { label: "Base64 encoding", isCorrect: false, order: 3 },
      { label: "MD5 without salt", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "auth-password-jwt-sessions",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Compare sessions vs JWT. When would you use server sessions?",
    "Sessions revoke instantly and stay small client-side; JWTs scale statelessly but need short expiry plus revocation handling.",
    [
      { label: "When you need instant revocation and small cookies", isCorrect: true, order: 1 },
      { label: "When you want unrevocable forever-tokens", isCorrect: false, order: 2 },
      { label: "Sessions cannot scale with a store", isCorrect: false, order: 3 },
      { label: "JWTs never expire", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "auth-password-jwt-sessions",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why keep auth tokens out of localStorage?",
    "Any injected script can read localStorage and steal tokens; httpOnly cookies hide them from JS.",
    [
      { label: "XSS can steal them; httpOnly cookies block JS access", isCorrect: true, order: 1 },
      { label: "localStorage is too small for tokens", isCorrect: false, order: 2 },
      { label: "Cookies never work with APIs", isCorrect: false, order: 3 },
      { label: "localStorage encrypts everything", isCorrect: false, order: 4 },
    ],
    3,
  );
  await mkQuestion(
    "auth-owasp-basics",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Which code prevents SQL injection for a login query?",
    "Bound parameters keep input as data, never as SQL syntax.",
    [
      { label: "db.query('SELECT * FROM users WHERE email = $1', [email])", isCorrect: true, order: 1 },
      { label: "db.query('SELECT * FROM users WHERE email = ' + email)", isCorrect: false, order: 2 },
      { label: "Hide the query in the frontend", isCorrect: false, order: 3 },
      { label: "Use GET instead of POST", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "auth-owasp-basics",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "User bios render with dangerouslySetInnerHTML and popups run scripts. What is the fix?",
    "Unescaped HTML enables stored XSS; sanitize or render as text with a strict allowlist.",
    [
      { label: "Sanitize HTML or render as text; never inject raw user HTML", isCorrect: true, order: 1 },
      { label: "Trust all user HTML", isCorrect: false, order: 2 },
      { label: "Use eval on the bio first", isCorrect: false, order: 3 },
      { label: "Disable authentication", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "auth-oauth",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What is the OAuth authorization-code flow for 'Log in with Google'?",
    "Your app redirects to Google, Google returns a code, and your server swaps it for tokens.",
    [
      { label: "Redirect to Google, get a code, server swaps it for tokens", isCorrect: true, order: 1 },
      { label: "Ask users for their Google password", isCorrect: false, order: 2 },
      { label: "Share your client secret in the frontend", isCorrect: false, order: 3 },
      { label: "Skip consent and redirect", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "auth-oauth",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Why does a SPA use PKCE with OAuth, and where do tokens live?",
    "PKCE blocks code interception on public clients; tokens belong in httpOnly cookies or a secure backend session.",
    [
      { label: "PKCE secures public clients; keep tokens out of readable JS storage", isCorrect: true, order: 1 },
      { label: "PKCE replaces HTTPS", isCorrect: false, order: 2 },
      { label: "Store refresh tokens in URLs", isCorrect: false, order: 3 },
      { label: "Skip state checks for speed", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "api-rest-versioning",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Which route design is most RESTful for reading one user?",
    "Plural nouns with the verb in the HTTP method keep URLs stable and predictable.",
    [
      { label: "GET /users/:id", isCorrect: true, order: 1 },
      { label: "POST /getUsers", isCorrect: false, order: 2 },
      { label: "GET /user?id=:id&action=fetch", isCorrect: false, order: 3 },
      { label: "FETCH /users/getOne", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "api-rest-versioning",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "When would you ship /v2 of an API instead of changing /v1?",
    "Breaking changes (renames, removed fields) need a new version so old clients keep working.",
    [
      { label: "A breaking field rename that old clients depend on", isCorrect: true, order: 1 },
      { label: "A backward-compatible new optional field", isCorrect: false, order: 2 },
      { label: "A typo fix in docs only", isCorrect: false, order: 3 },
      { label: "Every deploy", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "api-rest-versioning",
    "TRUE_FALSE",
    "INTERMEDIATE",
    "POST /getUsers with action=fetch in the body follows REST conventions. True or False?",
    "REST puts the verb in the HTTP method and the noun in the path; RPC-style verbs in URLs break that.",
    [
      { label: "True", isCorrect: false, order: 1 },
      { label: "False", isCorrect: true, order: 2 },
    ],
    3,
  );
  await mkQuestion(
    "api-pagination-filtering",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Why does a 10M-row social feed use cursor pagination instead of OFFSET?",
    "Offsets rescan skipped rows and drift on inserts; cursors resume from a stable key.",
    [
      { label: "Cursors stay fast and stable while offsets slow down and skip rows", isCorrect: true, order: 1 },
      { label: "Offsets are always faster at page 100000", isCorrect: false, order: 2 },
      { label: "Cursors require loading all rows first", isCorrect: false, order: 3 },
      { label: "Pagination never matters", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "api-pagination-filtering",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "Design list filtering: GET /orders?status=paid&sort=-createdAt&limit=20. Why this shape?",
    "Query params keep filters bookmarkable and cacheable; a minus prefix is a common desc convention.",
    [
      { label: "Query params express filters/sort/page in a cacheable URL", isCorrect: true, order: 1 },
      { label: "Filters belong in the HTTP method name", isCorrect: false, order: 2 },
      { label: "POST bodies are required for all reads", isCorrect: false, order: 3 },
      { label: "Sort order should be random", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "api-idempotency",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Which methods are idempotent, and what does that mean?",
    "Repeating them leaves the same state; GET/PUT/DELETE qualify while plain POST does not.",
    [
      { label: "GET, PUT, DELETE — repeats leave the same state", isCorrect: true, order: 1 },
      { label: "POST always — repeats never duplicate", isCorrect: false, order: 2 },
      { label: "No method is idempotent", isCorrect: false, order: 3 },
      { label: "Idempotent means faster", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "api-idempotency",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "A user double-clicks Pay and two POST /payments arrive. How does Idempotency-Key help?",
    "The server stores the first result under the key and replays it for retries instead of charging twice.",
    [
      { label: "Server dedups by key and replays the first result", isCorrect: true, order: 1 },
      { label: "The key makes POST faster", isCorrect: false, order: 2 },
      { label: "Clients should never retry", isCorrect: false, order: 3 },
      { label: "Delete the payment on retry", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "prod-observability-logging",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "Compare logs vs metrics vs traces. When would you use traces?",
    "Traces follow one request across services; metrics count health over time; logs explain single events.",
    [
      { label: "Traces for slow requests hopping across services", isCorrect: true, order: 1 },
      { label: "Traces for CPU averages only", isCorrect: false, order: 2 },
      { label: "Logs replace all dashboards", isCorrect: false, order: 3 },
      { label: "Metrics store full stack traces", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "prod-observability-logging",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "What belongs in production logs for a failed checkout?",
    "Structured JSON with request ID, user, amounts, and error — never secrets or full cards.",
    [
      { label: "Request id, route, error, context — no secrets", isCorrect: true, order: 1 },
      { label: "Full credit card numbers for debugging", isCorrect: false, order: 2 },
      { label: "Passwords to reproduce login", isCorrect: false, order: 3 },
      { label: "No context at all", isCorrect: false, order: 4 },
    ],
    2,
  );
  await mkQuestion(
    "prod-cicd-secrets",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What should CI run on every pull request?",
    "Lint, typecheck, tests, and build catch breaks before they reach main.",
    [
      { label: "Lint, typecheck, tests, and build", isCorrect: true, order: 1 },
      { label: "Deploy straight to production", isCorrect: false, order: 2 },
      { label: "Delete the test suite for speed", isCorrect: false, order: 3 },
      { label: "Nothing until release day", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "prod-cicd-secrets",
    "SHORT_ANSWER",
    "INTERMEDIATE",
    "In one sentence, where do production secrets live and why not in git?",
    "Secrets live in a vault or env manager with rotation because git history leaks forever.",
    [],
    2,
  );
  await mkQuestion(
    "prod-slo-error-budgets",
    "MULTIPLE_CHOICE",
    "BEGINNER",
    "What does a 99.9% checkout SLO over 30 days mean?",
    "About 43 minutes of failure budget; breaches should page and pause risky releases.",
    [
      { label: "Roughly 43 minutes of allowed failure per month", isCorrect: true, order: 1 },
      { label: "Zero failures ever allowed", isCorrect: false, order: 2 },
      { label: "99.9 requests per second", isCorrect: false, order: 3 },
      { label: "Only frontend bugs count", isCorrect: false, order: 4 },
    ],
    1,
  );
  await mkQuestion(
    "prod-slo-error-budgets",
    "MULTIPLE_CHOICE",
    "INTERMEDIATE",
    "The checkout error budget is exhausted. What should the team do?",
    "Freeze risky features and spend the budget on reliability until the SLO recovers.",
    [
      { label: "Pause features and fix reliability until budget recovers", isCorrect: true, order: 1 },
      { label: "Ship faster to outrun the errors", isCorrect: false, order: 2 },
      { label: "Delete the SLO", isCorrect: false, order: 3 },
      { label: "Ignore burn rate", isCorrect: false, order: 4 },
    ],
    2,
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
    "auth-security": "auth-password-jwt-sessions",
    "api-design": "api-rest-versioning",
    "production-engineering": "prod-observability-logging",
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
