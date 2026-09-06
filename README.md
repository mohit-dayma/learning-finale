# SkillForge — personal learning system

SkillForge is a Next.js 16 App Router app for structured self-study: practice
questions with spaced-repetition reviews, a mistake log with a feedback loop,
mock interview prep, study plans, and job-application tracking. One learner
account owns all personal data; the content catalog (skills → topics →
questions) is shared.

## Architecture

- **App Router routes** (`src/app`)
  - `/` — public landing page.
  - `/login`, `/signup` — public auth pages (Better Auth email + password).
  - `/dashboard` — learner home: weak areas, due reviews, recommendations.
  - `/tasks/[questionId]` — answer one practice question; records attempt
    metadata (confidence, AI assist level, perceived difficulty).
  - `/interview`, `/interview/[questionId]` — mock interview bank and
    per-question attempts with self-marked feedback.
  - `/career` — job-application tracker.
  - `/api/auth/[...all]` — Better Auth request handler (`GET` + `POST`).
- **Server actions** (`src/features/*/actions.ts`) — mutations for tasks,
  interview attempts, study plans, and career applications. Every action
  calls `requireUser()` (`src/lib/dal.ts`) and scopes writes to the session
  user's rows.
- **Prisma models** (`prisma/schema.prisma`, Postgres) — content catalog
  `Skill -> Topic -> Question` (`QuestionOption` rows hold MCQ choices);
  per-user state `TopicMastery`, `LearningSession`, `Answer`, `Review`
  (spaced repetition), `Mistake`, `StudyPlan` + `StudyPlanItem`,
  `InterviewQuestion` + `InterviewAttempt`, `CareerApplication`;
  auth tables `User`, `Session`, `Account`, `Verification` (Better Auth).
- **Learning engine** (`src/features/learning-engine/`, pure functions, no
  I/O) — `rotation`, `mastery`, `evaluate`, `review-schedule`, `ai-dependence`,
  `mistake-log`, `feedback-loop`, `recommend` (+ `verify-*` check scripts).
  Pages and actions import these; they never touch the database directly.
- **Auth sessions** — Better Auth with the Prisma adapter. Sessions live in
  the `Session` table; the browser holds only an `httpOnly` session cookie
  (via the `nextCookies()` plugin). `src/proxy.ts` does an optimistic
  cookie-presence redirect; the secure check is `requireUser()` on each
  protected page/action.

## Local setup

Prereqs: Node.js 20+, `pnpm@10.20.0`, and Postgres (local) or a Neon project.

```bash
git clone <repo-url> && cd learning-finale
pnpm install
cp .env.example .env
# Edit .env: set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
pnpm exec prisma migrate dev   # create DB schema from prisma/migrations
pnpm db:seed                   # load demo learner + question bank
pnpm dev                       # http://localhost:3000
```

Generate the auth secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Scripts (`pnpm <name>`)

| Command          | What it does                                  |
| ---------------- | --------------------------------------------- |
| `dev`            | Start Next.js dev server                      |
| `build`          | Production build (`next build`)               |
| `start`          | Serve the production build (`next start`)     |
| `typecheck`      | `tsc --noEmit`                                |
| `lint`           | `oxlint`                                      |
| `lint:fix`       | `oxlint --fix`                                |
| `format`         | `oxfmt` (write)                               |
| `format:check`   | `oxfmt --check` (CI-friendly)                 |
| `db:generate`    | `prisma generate` (regenerate client)         |
| `db:push`        | `prisma db push` (prototyping only, no migration file) |
| `db:migrate`     | `prisma migrate dev` (dev migration workflow) |
| `db:seed`        | `prisma db seed` → `tsx prisma/seed.ts`       |
| `db:studio`      | `prisma studio` (DB browser)                  |

## Prisma workflow

- **Normal dev change:** edit `prisma/schema.prisma`, then
  `pnpm db:migrate` (creates a migration in `prisma/migrations/` and applies
  it), then re-seed if needed (`pnpm db:seed`).
- **Quick prototype without a migration file:** `pnpm db:push`. Never use
  this on a shared/production database — it drifts schema without history.
- **Production deploys:** only `pnpm exec prisma migrate deploy` (applies
  committed migrations, never creates any). See Deployment below.
- **Check status (read-only, safe anytime):**
  `pnpm exec prisma migrate status`.

### Seeding

`prisma db seed` runs `tsx prisma/seed.ts` (wired in `prisma7.config.ts`).
The seed wipes and recreates a demo learner (`demo@skillforge.app`), 11
skills, 13 topics, 12 practice questions, a learning session with answers, a
review, a mistake, a study plan, the full interview bank (loaded from
`src/features/interview/seed-data.ts` so app and seed never drift), and one
career application. **Never run the seed against production** — it deletes
existing rows.

## Environment variables

Only three variables exist; nothing reads `DIRECT_URL`.

| Variable             | Required | Where used                              | Example                                              |
| -------------------- | -------- | --------------------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`       | Yes      | `src/lib/db.ts`, `prisma7.config.ts`, `prisma/seed.ts` | `postgresql://user:password@localhost:5432/learning?sslmode=require` |
| `BETTER_AUTH_SECRET` | Yes      | Better Auth session signing (server-only) | 32-byte base64 from the `node -e crypto` command above |
| `BETTER_AUTH_URL`    | Yes      | Better Auth canonical URL               | `http://localhost:3000` locally; `https://your-app.vercel.app` in prod |

Neon pooled vs direct: use the **pooled** URL (`-pooler` hostname) in
`DATABASE_URL` at runtime. For `migrate deploy`, override the same variable
with the **direct** URL for that one command (poolers can break DDL):

```bash
DATABASE_URL="<direct-url>?sslmode=require" pnpm exec prisma migrate deploy
```

## Deployment (Vercel + Neon)

1. Create a Neon project; copy the **pooled** connection string
   (`?sslmode=require`) and the **direct** one.
2. In Vercel → project → Settings → Environment Variables, set for
   Production (and Preview as needed):
   - `DATABASE_URL` = pooled URL.
   - `BETTER_AUTH_SECRET` = fresh per-environment secret (generate with the
     `node -e crypto` command; never reuse the local one).
   - `BETTER_AUTH_URL` = `https://your-app.vercel.app` (update after every
     domain change or auth cookies/callbacks break).
3. Apply migrations without touching the seed:
   ```bash
   DATABASE_URL="<direct-url>?sslmode=require" pnpm exec prisma migrate deploy
   ```
   Run this from CI or your machine against the production database — or as
   a Vercel build step before `next build` if you prefer.
4. Build command: `pnpm build` (Vercel auto-detects pnpm via
   `packageManager`). Start/output: default Next.js Node server, no
   `output: "export"` (see `next.config.ts`).
5. Generic Node hosting instead of Vercel: `pnpm install`, set the same
   three env vars, run `migrate deploy`, then `pnpm build && pnpm start`.

## Security notes

- Secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`) are server-only: read via
  `process.env` in `src/lib/db.ts` / Better Auth config, never imported by
  client components. There are no `NEXT_PUBLIC_*` variables.
- Sessions use `httpOnly` cookies managed by Better Auth (`nextCookies()`
  plugin); nothing auth-related uses `localStorage`. Password hashes live in
  `Account.password` (provider `credential`), never in `User`.
- `.env*` is gitignored (only `.env.example` is committed, placeholders
  only). Missing `DATABASE_URL` fails fast with an explicit error telling
  you to copy `.env.example`.

## Troubleshooting

- **`Missing required environment variable "DATABASE_URL"`** — you have no
  `.env`. Run `cp .env.example .env` and set the three vars. (`.env` keys:
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — `DIRECT_URL`
  is intentionally absent; nothing reads it.)
- **Neon `sslmode` / connection errors** — both local and Neon URLs must
  include `?sslmode=require`. Localhost with `sslmode=require` works
  because the `pg` driver does not verify self-signed certs by default;
  on Neon it enforces TLS.
- **Prisma adapter errors (`PrismaPg` / Neon driver)** — the runtime
  (`src/lib/db.ts`) and seed use `@prisma/adapter-pg` with a plain `pg`
  pool, which works for local Postgres and Neon (pooled or direct). The
  `@prisma/adapter-neon` + `@neondatabase/serverless` packages are installed
  but unused; do not switch adapters unless local Postgres support is
  dropped. The driver-adapter pattern (Prisma 7 requires an adapter even
  for `migrate`/`seed`) is configured in `prisma7.config.ts`.
- **Auth redirects to localhost after deploy** — `BETTER_AUTH_URL` still
  points at `http://localhost:3000`. Set it to the production URL.
- **Logged-out users see protected pages flash** — `proxy.ts` only checks
  cookie presence; the secure gate is `requireUser()`. The matcher covers
  `/dashboard/*`, `/tasks/*`, `/interview/*`, and `/career/*`.
- **Schema drift** — run `pnpm exec prisma migrate status` (read-only). If
  it reports drift on a dev DB, reconcile with `pnpm db:migrate`; on
  production, only ever `migrate deploy`.
