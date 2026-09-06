// Interview seed questions (wired into prisma/seed.ts by the main agent).
//
// 50 questions covering all 14 skill categories (>= 2 each) and all 5
// formats (>= 5 each). topicSlug uses existing topic slugs where possible;
// system-design / ai-engineering / ai-evaluation use topicSlug null (the
// main agent creates those skills/topics).

export interface InterviewSeedQuestion {
  skillSlug: string;
  topicSlug: string | null;
  title: string;
  prompt: string;
  expectedAnswer: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  category: "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN";
  format:
    | "TECHNICAL_EXPLANATION"
    | "CODING"
    | "DEBUGGING"
    | "DESIGN"
    | "SCENARIO";
  interviewWeight: number;
  keyPoints: string;
  commonMisconceptions: string;
  followUpPrompt: string;
  followUpExpected: string;
}

export const INTERVIEW_SEED_QUESTIONS: InterviewSeedQuestion[] = [
  {
    skillSlug: "javascript",
    topicSlug: "js-closures-scope",
    title: "Explain closures in JavaScript",
    prompt:
      "An interviewer asks: 'What is a closure, and when would you use one?' Answer as you would out loud in 2-3 minutes.",
    expectedAnswer:
      "A closure is a function that remembers variables from its outer scope even after that scope has finished. Use closures for private state, factory functions, callbacks, and memoization.",
    difficulty: "BEGINNER",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 4,
    keyPoints:
      "Closure keeps outer variables alive after the outer function returns\nPrivate state without classes or globals\nUsed for factories callbacks and memoization\nEach call creates fresh independent closed-over variables",
    commonMisconceptions:
      "Closure copies values instead of referencing live bindings\nClosures always cause memory leaks\nOnly inner functions declared with the function keyword close over scope",
    followUpPrompt: "How would you avoid the classic var-in-a-loop setTimeout bug?",
    followUpExpected:
      "Use let for block scoping, or wrap the body in an IIFE and pass i as an argument.",
  },
  {
    skillSlug: "javascript",
    topicSlug: "js-closures-scope",
    title: "Implement debounce",
    prompt:
      "Write a debounce(fn, wait) helper that delays invoking fn until wait ms have passed without another call.\n```js\nfunction debounce(fn, wait) {\n  // your code here\n}\n```",
    expectedAnswer:
      "Store the timer in a closure. On each call clear the previous timeout and start a new one that invokes fn with the latest this and arguments.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 5,
    keyPoints:
      "Timer stored in closure across calls\nClear previous timeout on each call\nForward this and arguments with apply or spread\nTrailing edge invokes after the quiet period",
    commonMisconceptions:
      "Debounce and throttle are the same thing\nThe timer variable can live outside the returned function safely\nForgetting to clear the timer still works",
    followUpPrompt: "How would you add leading-edge invocation and cancel support?",
    followUpExpected:
      "Add an immediate flag for the leading edge and expose a cancel method that clears the timer.",
  },
  {
    skillSlug: "typescript",
    topicSlug: "ts-types-narrowing",
    title: "Narrowing a discriminated union",
    prompt:
      "Given type Shape = Circle | Square sharing a kind field, explain how TypeScript narrows the union and why the discriminant must be a literal type.",
    expectedAnswer:
      "Check the shared literal discriminant (for example kind === 'circle'). TypeScript narrows the union in that branch, and a never check makes unhandled cases a compile error.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 4,
    keyPoints:
      "Discriminant is a shared literal field like kind\nChecking the literal narrows the union in that branch\nLiteral types let the compiler rule out members\nExhaustiveness checking with never catches missing cases",
    commonMisconceptions:
      "typeof checks narrow object unions by themselves\nAny shared field works as a discriminant\nType guards change runtime values",
    followUpPrompt: "What happens if you forget a case in a switch that returns never?",
    followUpExpected:
      "Compile error: the unhandled union member is not assignable to never.",
  },
  {
    skillSlug: "typescript",
    topicSlug: "ts-types-narrowing",
    title: "Debug an any leak",
    prompt:
      "This function silently accepts anything and the bug reached production.\n```ts\nfunction total(prices: any[]) {\n  return prices.reduce((a, b) => a + b);\n}\n```\nWhat is wrong and how do you fix it?",
    expectedAnswer:
      "The any element type disables checking. Type the array as number[], annotate the reduce accumulator, and use unknown plus narrowing at untrusted boundaries.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DEBUGGING",
    interviewWeight: 3,
    keyPoints:
      "any disables checking on elements and accumulator\nGive reduce a typed initial value and parameter types\nPrefer unknown plus narrowing when input is untrusted\nReturn type annotation documents the contract",
    commonMisconceptions:
      "any and unknown behave the same\nAdding types slows the program at runtime\nreduce infers everything so annotations never matter",
    followUpPrompt: "When would you choose unknown over a specific type?",
    followUpExpected:
      "At trust boundaries such as parsing JSON or reading user input, then narrow before use.",
  },
  {
    skillSlug: "react",
    topicSlug: "react-hooks-rendering",
    title: "Why did this list re-render?",
    prompt:
      "A 1000-row list lags on each keystroke in a filter input. Walk through how you find the cause and fix it.",
    expectedAnswer:
      "State lives too high so every keystroke re-renders all rows. Memoize rows, stabilize callbacks, use stable keys, and virtualize or debounce the filter.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 5,
    keyPoints:
      "State lives too high so every keystroke re-renders all rows\nMemoize rows with memo and stabilize props and callbacks\nUse stable keys never array indexes\nVirtualize the list or debounce the filter",
    commonMisconceptions:
      "memo alone fixes re-renders without stable props\nKeys only silence warnings and never affect behavior\nuseMemo and useCallback are always free performance wins",
    followUpPrompt: "How do you confirm the fix worked?",
    followUpExpected:
      "React DevTools profiler with highlight updates, plus input latency measured before and after.",
  },
  {
    skillSlug: "react",
    topicSlug: "react-hooks-rendering",
    title: "Build a usePrevious hook",
    prompt:
      "Write usePrevious(value) that returns the value from the previous render.\n```tsx\nfunction usePrevious<T>(value: T): T | undefined {\n  // your code here\n}\n```",
    expectedAnswer:
      "Keep the previous value in a ref, update the ref inside useEffect after commit, and return the ref value from before the update.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 4,
    keyPoints:
      "Ref holds the previous value across renders\nEffect updates the ref after render commits\nReturn ref current from before the update\nGeneric keeps the return type tied to the input",
    commonMisconceptions:
      "State should store the previous value instead of a ref\nUpdating the ref during render is always safe\nRefs trigger re-renders when mutated",
    followUpPrompt: "Why update the ref inside useEffect instead of during render?",
    followUpExpected:
      "Render must stay pure; concurrent renders could otherwise read torn values.",
  },
  {
    skillSlug: "nextjs",
    topicSlug: "nextjs-app-router",
    title: "Server Components vs Client Components",
    prompt:
      "Explain when you would use a Server Component versus a 'use client' component in the App Router, and where data fetching belongs.",
    expectedAnswer:
      "Fetch in Server Components on the server, reserve 'use client' for state, effects, and browser APIs, and keep client boundaries small and low in the tree.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 5,
    keyPoints:
      "Server Components run on the server and can fetch directly\nClient components handle state effects and browser APIs\nFetch on the server and pass serializable props down\nKeep use client boundaries small and low in the tree",
    commonMisconceptions:
      "use client makes the whole page client rendered\nServer Components can use useState and event handlers\nFetching in useEffect is preferred over server fetching",
    followUpPrompt: "What cannot cross the server-client boundary as props?",
    followUpExpected:
      "Functions and non-serializable values; pass data plus Server Actions instead.",
  },
  {
    skillSlug: "nextjs",
    topicSlug: "nextjs-app-router",
    title: "Slow product page",
    prompt:
      "Your Next.js product page loads slowly: it fetches reviews, stock, and recommendations in a waterfall from the client. Propose a fix.",
    expectedAnswer:
      "Move fetching into an async Server Component, load independent sources in parallel, stream slow sections with Suspense, and cache repeated reads.",
    difficulty: "ADVANCED",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 3,
    keyPoints:
      "Move fetching to an async Server Component\nFetch independent sources in parallel with Promise all\nStream slow sections with Suspense boundaries\nCache repeated reads and revalidate on a schedule",
    commonMisconceptions:
      "Adding more useEffect calls fixes waterfalls\nClient-side fetching is always faster than server fetching\nSuspense alone makes data load faster",
    followUpPrompt: "When would you still fetch on the client?",
    followUpExpected:
      "User-specific interactive data that changes with client state.",
  },
  {
    skillSlug: "backend",
    topicSlug: "backend-rest-node",
    title: "Design POST /users",
    prompt:
      "Design POST /users for account signup: status codes, validation errors, and idempotency. What do you return on success?",
    expectedAnswer:
      "Return 201 with the created resource and a Location header, 400 with field errors for invalid input, 409 for duplicate email, and an idempotency key against retries.",
    difficulty: "BEGINNER",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 4,
    keyPoints:
      "201 with the created resource and a Location header\n400 with field-level errors for invalid input\n409 when the email already exists\nIdempotency key or unique constraint prevents duplicates",
    commonMisconceptions:
      "200 is correct for every successful POST\nValidation errors should return 500\nClients can retry POSTs safely without idempotency",
    followUpPrompt: "How do you prevent duplicate accounts on retried requests?",
    followUpExpected:
      "Unique constraint on email plus an idempotency key stored with the request.",
  },
  {
    skillSlug: "backend",
    topicSlug: "backend-rest-node",
    title: "Rate limiting an API",
    prompt:
      "Design rate limiting for a public API: 100 requests per minute per key. Where does it live and what happens when the limit is hit?",
    expectedAnswer:
      "Enforce in middleware or the gateway with token-bucket counters in a fast store, return 429 with Retry-After, and report limit headers.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DESIGN",
    interviewWeight: 4,
    keyPoints:
      "Middleware or gateway checks before handlers\nToken bucket or fixed window counters in fast storage\n429 with Retry-After when the limit is exceeded\nHeaders report limit remaining and reset time",
    commonMisconceptions:
      "Rate limiting belongs inside each handler\nReturning 400 for over-limit requests is standard\nIn-memory counters work unchanged across replicas",
    followUpPrompt: "How do you share counters across instances?",
    followUpExpected:
      "Central store like Redis with atomic increments and TTL.",
  },
  {
    skillSlug: "postgresql",
    topicSlug: "pg-joins-indexes",
    title: "LEFT JOIN vs INNER JOIN",
    prompt:
      "You need all users plus their orders if any exist. Which join do you use, and what do missing orders look like?",
    expectedAnswer:
      "Use LEFT JOIN: every user is kept and missing orders come back as NULL. INNER JOIN would drop users without orders.",
    difficulty: "BEGINNER",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 3,
    keyPoints:
      "LEFT JOIN keeps every row from the left table\nMissing right-side rows come back as NULL\nINNER JOIN drops users without orders\nFilter on the right table belongs in the ON clause",
    commonMisconceptions:
      "LEFT and INNER JOIN return the same rows\nNULL means the query failed\nWHERE on the right table never changes join behavior",
    followUpPrompt: "Why does WHERE orders.id IS NOT NULL change the result?",
    followUpExpected:
      "It filters after the join and removes the NULL-extended rows.",
  },
  {
    skillSlug: "postgresql",
    topicSlug: "pg-joins-indexes",
    title: "Slow query with an index",
    prompt:
      "This query is slow despite an index on users(email).\n```sql\nSELECT * FROM users WHERE LOWER(email) = 'a@x.com';\n```\nWhy is the index ignored and how do you fix it?",
    expectedAnswer:
      "The function on the column blocks a plain btree lookup. Add an expression index on LOWER(email) and verify with EXPLAIN ANALYZE.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DEBUGGING",
    interviewWeight: 4,
    keyPoints:
      "Function on the column prevents a plain btree lookup\nCreate an expression index on LOWER(email)\nOr store and compare a normalized column\nCheck with EXPLAIN ANALYZE before and after",
    commonMisconceptions:
      "Any index on the column helps any query on it\nSELECT star is always free when an index exists\nIndexes never slow down writes",
    followUpPrompt: "What is the write-side cost of adding that index?",
    followUpExpected: "Slower inserts and updates plus extra storage.",
  },
  {
    skillSlug: "system-design",
    topicSlug: null,
    title: "Design a URL shortener",
    prompt:
      "Design a URL shortener for 100M URLs and a 10:1 read-write ratio. Cover ID generation, storage, scaling, and one failure mode.",
    expectedAnswer:
      "Generate base62 codes from a counter or hash with collision handling, store in a key-value store, cache hot codes with read replicas, and guard against abuse with quotas and expiry.",
    difficulty: "ADVANCED",
    category: "SYSTEM_DESIGN",
    format: "DESIGN",
    interviewWeight: 5,
    keyPoints:
      "Base62 counter or hash with collision handling\nKey-value storage indexed by short code\nCache hot codes and scale reads with replicas\nHandle collisions duplicates and abuse with TTLs and limits",
    commonMisconceptions:
      "Auto-increment IDs are safe to expose directly\nOne database handles all scale without caching\nShort codes never collide so checks are wasteful",
    followUpPrompt: "How do you handle malicious users creating millions of links?",
    followUpExpected:
      "Auth plus quotas, CAPTCHA, expiry, and blocklists.",
  },
  {
    skillSlug: "system-design",
    topicSlug: null,
    title: "Feed outage postmortem",
    prompt:
      "Your home feed went down for 30 minutes during peak: the fan-out queue backed up and the database fell over. Walk through your response and longer-term fixes.",
    expectedAnswer:
      "Mitigate with load shedding and stale-cache fallbacks, trace the root cause to queue lag and hot partitions, then add backpressure, autoscaling, and circuit breakers with runbooks.",
    difficulty: "ADVANCED",
    category: "SYSTEM_DESIGN",
    format: "SCENARIO",
    interviewWeight: 4,
    keyPoints:
      "Mitigate first with load shedding and read-only fallbacks\nFind root cause in queue lag and hot partitions\nAdd backpressure autoscaling and circuit breakers\nFollow up with runbooks and load tests",
    commonMisconceptions:
      "Adding servers during the incident always helps\nPostmortems are about assigning blame\nOne fix guarantees it never recurs",
    followUpPrompt: "How do you prevent a thundering herd on recovery?",
    followUpExpected:
      "Staggered restarts, jittered retries, and cached stale reads.",
  },
  {
    skillSlug: "dsa",
    topicSlug: "dsa-big-o-arrays",
    title: "Hash map lookup cost",
    prompt:
      "What is the average and worst-case cost of a hash-map lookup, and what causes the worst case?",
    expectedAnswer:
      "Average O(1) with an even hash spread; worst case O(n) when keys collide into one bucket. Load-factor resizing keeps lookups amortized constant.",
    difficulty: "BEGINNER",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 3,
    keyPoints:
      "Average O(1) when hashes spread evenly\nWorst case O(n) when keys collide into one bucket\nLoad factor triggers resizing to stay amortized\nGood hash functions keep distribution uniform",
    commonMisconceptions:
      "Hash maps are always exactly O(1)\nCollisions are impossible with modern hashes\nResizing is free and never pauses",
    followUpPrompt: "How does a load factor threshold keep lookups fast?",
    followUpExpected: "It resizes and rehashes before chains grow long.",
  },
  {
    skillSlug: "dsa",
    topicSlug: "dsa-lists-stacks",
    title: "Balanced brackets",
    prompt:
      "Write isBalanced(s) that returns true when brackets are correctly nested.\n```js\nfunction isBalanced(s) {\n  // your code here\n}\n```",
    expectedAnswer:
      "Push openings onto a stack; each closing bracket must match the stack top. Balanced means the stack ends empty: O(n) time and space.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 4,
    keyPoints:
      "Stack pushes every opening bracket\nClosing bracket must match the top of stack\nEmpty stack at the end means balanced\nSingle pass gives O(n) time and O(n) space",
    commonMisconceptions:
      "Counting opens and closes is enough\nA queue works just as well as a stack\nNesting order never matters",
    followUpPrompt: "How would you also report the first mismatch position?",
    followUpExpected:
      "Push indexes alongside brackets and return the failing index.",
  },
  {
    skillSlug: "ai-engineering",
    topicSlug: null,
    title: "RAG in production",
    prompt:
      "Explain retrieval-augmented generation end to end: indexing, retrieval, generation, and how you evaluate whether it helped.",
    expectedAnswer:
      "Chunk and embed documents into a vector index, retrieve top-k chunks at query time, ground the prompt with cited context, and measure faithfulness and relevance on a test set.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 4,
    keyPoints:
      "Chunk and embed documents into a vector index\nRetrieve top-k chunks by similarity at query time\nGround the prompt with citations to retrieved context\nMeasure faithfulness and answer relevance on a test set",
    commonMisconceptions:
      "RAG removes hallucinations entirely\nBigger chunks are always better for recall\nEvaluation needs no ground truth or test set",
    followUpPrompt: "What do you do when retrieval returns irrelevant chunks?",
    followUpExpected:
      "Tune chunking, metadata filters, hybrid search, and reranking.",
  },
  {
    skillSlug: "ai-engineering",
    topicSlug: null,
    title: "LLM costs spike",
    prompt:
      "Your support chatbot bill tripled after launch: long histories and verbose answers. How do you cut cost without hurting quality?",
    expectedAnswer:
      "Summarize history, cap max tokens, cache common answers, and route easy queries to a smaller model while guarding quality with an eval set.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 4,
    keyPoints:
      "Summarize or truncate conversation history\nCap max tokens and tune temperature and prompts\nCache common answers and reuse embeddings\nRoute easy queries to a smaller cheaper model",
    commonMisconceptions:
      "Only the model price per token matters\nLonger context always improves answers\nCaching never applies to chatbots",
    followUpPrompt: "How do you know quality did not regress?",
    followUpExpected:
      "Eval set with graded answers plus spot-checked sessions.",
  },
  {
    skillSlug: "ai-evaluation",
    topicSlug: null,
    title: "Judge LLM output quality",
    prompt:
      "You must grade 500 model summaries for faithfulness. Design an LLM-as-judge setup and name two ways it can go wrong.",
    expectedAnswer:
      "Score against a rubric with anchored examples, randomize order, use multiple judges, check agreement before trusting scores, and watch for position, verbosity, and self-preference bias.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 3,
    keyPoints:
      "Rubric with anchored examples and a fixed scale\nBlind randomized order with multiple judges\nMeasure agreement between judges before trusting scores\nWatch for position verbosity and self-preference bias",
    commonMisconceptions:
      "A single judge score is enough to trust\nLLM judges have no systematic biases\nHuman labels are never needed for calibration",
    followUpPrompt: "How do you calibrate the judge?",
    followUpExpected:
      "Gold-labeled set plus agreement metrics against humans.",
  },
  {
    skillSlug: "ai-evaluation",
    topicSlug: null,
    title: "Regression in weekly evals",
    prompt:
      "Weekly eval scores dropped 8 points after a prompt change. Walk through how you investigate and decide whether to roll back.",
    expectedAnswer:
      "Slice the drop to find failing cases, reproduce on a fixed seed and frozen set, diff outputs to separate noise from regression, and roll back when key slices stay red.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 3,
    keyPoints:
      "Check slice-level drops to find the failing cases\nReproduce on a fixed seed and frozen test set\nDiff outputs to separate real regressions from noise\nRoll back when slices that matter stay red",
    commonMisconceptions:
      "One aggregate score tells the whole story\nAny drop always means the model got worse\nRollbacks are never needed for prompt changes",
    followUpPrompt: "How do you tell noise from a real regression?",
    followUpExpected:
      "Confidence intervals plus repeated runs on fixed seeds.",
  },
  {
    skillSlug: "ai",
    topicSlug: "ai-prompt-embed",
    title: "Reliable JSON from an LLM",
    prompt:
      "An interviewer asks: 'How do you get stable JSON out of an LLM for a signup form?' Answer as you would out loud in 2 minutes.",
    expectedAnswer:
      "Constrain the schema in the prompt, demand no extra text, validate and retry on parse failure, and prefer structured output modes when available.",
    difficulty: "BEGINNER",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 3,
    keyPoints:
      "State the exact schema and types in the prompt\nDemand no extra text outside the JSON\nValidate output and retry with the error\nUse structured output or function calling when available",
    commonMisconceptions:
      "A polite prompt alone guarantees valid JSON\nLonger prompts always parse better\nValidation is unnecessary with good prompts",
    followUpPrompt: "What do you do when the model still returns prose around the JSON?",
    followUpExpected:
      "Extract the fenced block, re-prompt with the parse error, and fall back to a repair pass.",
  },
  {
    skillSlug: "ai",
    topicSlug: "ai-rag-basics",
    title: "Hallucinating support bot",
    prompt:
      "Your support chatbot invents refund policies that do not exist. Walk through how you would ground it with RAG.",
    expectedAnswer:
      "Index the real policy docs, retrieve top chunks per question, cite them in the prompt, and refuse or escalate when nothing relevant is found.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 4,
    keyPoints:
      "Index the authoritative policy documents\nRetrieve top-k chunks for each question\nGround the prompt with cited context\nRefuse or escalate when retrieval finds nothing",
    commonMisconceptions:
      "RAG removes hallucinations entirely\nBigger chunks always help\nNo eval set is needed after adding RAG",
    followUpPrompt: "How do you handle a policy update?",
    followUpExpected:
      "Re-index the changed docs and version the index with the eval set.",
  },
  {
    skillSlug: "auth-security",
    topicSlug: "auth-password-jwt-sessions",
    title: "Storing passwords safely",
    prompt:
      "Explain how you store passwords for a new app: hashing, salting, and what you never do.",
    expectedAnswer:
      "Use a slow salted hash like bcrypt, scrypt, or argon2 with per-user salts, never store plaintext, and rate-limit login attempts.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 5,
    keyPoints:
      "Slow salted hash such as bcrypt scrypt or argon2\nUnique salt per user built into the hash\nNever store plaintext or fast unsalted hashes\nRate-limit logins and constant-time compare",
    commonMisconceptions:
      "Base64 or MD5 is enough for passwords\nOne global salt is fine\nPlaintext helps password recovery",
    followUpPrompt: "How do you migrate users from an old weak hash?",
    followUpExpected:
      "Re-hash on next successful login and flag migrated accounts.",
  },
  {
    skillSlug: "auth-security",
    topicSlug: "auth-password-jwt-sessions",
    title: "JWT vs server sessions",
    prompt:
      "Compare JWTs and server-side sessions for a banking app versus a public read API. When would you use each?",
    expectedAnswer:
      "Use server sessions for banking for instant revocation, and short-lived JWTs for scalable reads, with refresh rotation and revocation lists where needed.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 4,
    keyPoints:
      "Sessions revoke instantly and keep cookies small\nJWTs scale statelessly across services\nBanking needs revocation and short lifetimes\nUse refresh rotation and denylists for JWT logout",
    commonMisconceptions:
      "JWTs are encrypted by default\nStateless means revocation is free\nSessions cannot scale",
    followUpPrompt: "How do you log a user out everywhere with JWTs?",
    followUpExpected:
      "Short access lifetime plus refresh rotation with a revocation list.",
  },
  {
    skillSlug: "auth-security",
    topicSlug: "auth-owasp-basics",
    title: "XSS in user bios",
    prompt:
      "This profile page runs attacker scripts.\n```tsx\n<div dangerouslySetInnerHTML={{ __html: bio }} />\n```\nWhat is wrong and how do you fix it?",
    expectedAnswer:
      "Raw user HTML enables stored XSS. Render as text or sanitize with a strict allowlist and a content security policy.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DEBUGGING",
    interviewWeight: 4,
    keyPoints:
      "Raw user HTML runs as stored XSS\nRender as text or sanitize with an allowlist\nAdd a content security policy\nEscape output by default",
    commonMisconceptions:
      "Only login forms need XSS protection\nClient-side checks alone stop stored XSS\nSanitization is never needed with React",
    followUpPrompt: "When is dangerouslySetInnerHTML ever acceptable?",
    followUpExpected:
      "Only for fully trusted sanitized markup, never raw user input.",
  },
  {
    skillSlug: "auth-security",
    topicSlug: "auth-oauth",
    title: "Login with Google",
    prompt:
      "Design 'Log in with Google' for a web app and a mobile app: flow, PKCE, scopes, and where tokens live.",
    expectedAnswer:
      "Use authorization code with PKCE, minimal scopes, server-side code exchange, httpOnly session cookies, and state plus redirect validation.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DESIGN",
    interviewWeight: 4,
    keyPoints:
      "Authorization code flow with PKCE for public clients\nMinimal scopes and validated redirect URIs\nServer exchanges the code for tokens\nTokens live in httpOnly cookies or backend sessions",
    commonMisconceptions:
      "Ask users for their Google password\nPut the client secret in the frontend\nExtra scopes are harmless",
    followUpPrompt: "How do you handle token refresh on mobile?",
    followUpExpected:
      "Secure storage with rotating refresh tokens and re-auth on reuse.",
  },
  {
    skillSlug: "api-design",
    topicSlug: "api-rest-versioning",
    title: "What makes an API RESTful",
    prompt:
      "An interviewer asks: 'What makes an API RESTful?' Cover resources, methods, status codes, and statelessness in 2 minutes.",
    expectedAnswer:
      "Model nouns as resources, verbs as HTTP methods, use correct status codes, stay stateless, and keep URLs predictable with versioning for breaks.",
    difficulty: "BEGINNER",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 3,
    keyPoints:
      "Resources as plural nouns with HTTP verbs\nCorrect status codes like 201 and 404\nStateless requests carrying their own context\nVersioning for breaking changes",
    commonMisconceptions:
      "Any JSON over HTTP is REST\nVerbs belong in the URL\nStatus codes do not matter",
    followUpPrompt: "When would you break REST and use RPC?",
    followUpExpected:
      "Actions that map poorly to resources, like transcoding or transfers.",
  },
  {
    skillSlug: "api-design",
    topicSlug: "api-pagination-filtering",
    title: "Paginate a 10M-row feed",
    prompt:
      "Design GET /posts for a 10M-row feed: pagination, filtering, sorting, and why OFFSET alone fails.",
    expectedAnswer:
      "Use cursor pagination on a stable key, query-param filters and sort, limits plus total handling, and document next cursors.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DESIGN",
    interviewWeight: 4,
    keyPoints:
      "Cursor on a stable key instead of deep OFFSET\nFilters and sort as query params\nLimit plus next cursor in the response\nIndex the sort and filter columns",
    commonMisconceptions:
      "OFFSET stays fast at page 100000\nCursors require loading everything\nSorting needs no index",
    followUpPrompt: "How do you keep pages stable when rows are inserted?",
    followUpExpected:
      "Cursor on createdAt plus id tiebreaker.",
  },
  {
    skillSlug: "api-design",
    topicSlug: "api-idempotency",
    title: "Double charge on retry",
    prompt:
      "Users get double-charged when POST /payments is retried after a timeout. Design the idempotency fix end to end.",
    expectedAnswer:
      "Clients send an Idempotency-Key, the server stores the first result under it, replays it on retry, and expires keys safely.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 5,
    keyPoints:
      "Client generates an Idempotency-Key per intent\nServer stores the first result under the key\nRetries replay the stored result\nKeys expire and scope to the user",
    commonMisconceptions:
      "POST is idempotent by default\nClients should never retry\nDedup belongs only in the frontend",
    followUpPrompt: "What if two different payments reuse the same key?",
    followUpExpected:
      "Reject with a key-reuse error scoped to user and fingerprint.",
  },
  {
    skillSlug: "api-design",
    topicSlug: "api-rest-versioning",
    title: "Breaking change without a version",
    prompt:
      "A renamed field broke half your API consumers overnight. Walk through the response and how you version next time.",
    expectedAnswer:
      "Roll back or dual-serve the old field, communicate the window, then version with deprecation headers and a migration guide.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DEBUGGING",
    interviewWeight: 3,
    keyPoints:
      "Restore the old field or roll back first\nDual-serve with deprecation headers\nVersion breaking changes under v2\nPublish a migration guide and sunset date",
    commonMisconceptions:
      "Renames are always safe\nClients should read code daily\nVersions are never needed",
    followUpPrompt: "How long do you keep v1 alive?",
    followUpExpected:
      "Until usage drops below the agreed threshold after notice.",
  },
  {
    skillSlug: "production-engineering",
    topicSlug: "prod-observability-logging",
    title: "Logs metrics traces",
    prompt:
      "Explain logs, metrics, and traces to a junior: what each is and when you reach for it during a slow-checkout incident.",
    expectedAnswer:
      "Metrics alert on burn, traces find the slow hop across services, and structured logs explain the failing request.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 4,
    keyPoints:
      "Metrics track health over time and alert\nTraces follow one request across services\nLogs explain single events with context\nRequest IDs tie all three together",
    commonMisconceptions:
      "Logs alone replace dashboards\nMetrics store full stack traces\nTracing is only for frontend",
    followUpPrompt: "What do you add first when blind in an incident?",
    followUpExpected:
      "Request IDs plus structured logs at the failing hop.",
  },
  {
    skillSlug: "production-engineering",
    topicSlug: "prod-cicd-secrets",
    title: "Secret committed to git",
    prompt:
      "An AWS key was committed to a public repo 2 hours ago and bots may have scraped it. Walk through your response.",
    expectedAnswer:
      "Revoke and rotate immediately, purge from history, scan for abuse, and add secret scanning plus vault-backed deploys.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 4,
    keyPoints:
      "Revoke and rotate the key immediately\nPurge from history and check for abuse\nAdd secret scanning to CI\nMove secrets to a vault with rotation",
    commonMisconceptions:
      "Deleting the commit is enough\nOnly the latest commit leaks\nRotation can wait",
    followUpPrompt: "How do you prevent this next time?",
    followUpExpected:
      "Pre-commit hooks, CI scanning, and vault injection at deploy.",
  },
  {
    skillSlug: "production-engineering",
    topicSlug: "prod-slo-error-budgets",
    title: "SLOs for checkout",
    prompt:
      "Define SLIs and SLOs for a checkout API: what you measure, targets, and what happens when the budget burns.",
    expectedAnswer:
      "Measure success rate and latency percentiles, set targets like 99.9 percent in 28 days, and freeze risky releases when the budget burns fast.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DESIGN",
    interviewWeight: 4,
    keyPoints:
      "SLIs for success rate and latency percentiles\nSLO targets over a rolling window\nError budget from the allowed failure rate\nBurn-rate alerts gate releases",
    commonMisconceptions:
      "100 percent uptime is a useful SLO\nAverages alone describe latency\nBudgets never change behavior",
    followUpPrompt: "What do you do when the budget is gone?",
    followUpExpected:
      "Freeze features and spend capacity on reliability.",
  },
  {
    skillSlug: "production-engineering",
    topicSlug: "prod-observability-logging",
    title: "Outage you debugged",
    prompt:
      "Tell me about a production outage you helped debug: your role, how you found the cause, and what changed afterward.",
    expectedAnswer:
      "Describe the symptom, your investigation with metrics traces and logs, the fix, and the runbook or alert that prevents repeats.",
    difficulty: "INTERMEDIATE",
    category: "BEHAVIORAL",
    format: "SCENARIO",
    interviewWeight: 3,
    keyPoints:
      "Clear role and timeline of the incident\nEvidence from metrics traces and logs\nRoot cause plus the actual fix\nFollow-up runbook test or alert",
    commonMisconceptions:
      "Blaming others is a good answer\nSkipping what you learned is fine\nNo follow-up is needed",
    followUpPrompt: "What would you do differently next time?",
    followUpExpected:
      "Earlier escalation with better dashboards or runbooks.",
  },
  {
    skillSlug: "javascript",
    topicSlug: "js-event-loop-async",
    title: "forEach with await bug",
    prompt:
      "This code finishes before saving all rows.\n```js\nrows.forEach(async (r) => { await save(r); });\nconsole.log('done');\n```\nWhy and how do you fix it?",
    expectedAnswer:
      "forEach does not await callbacks, so done logs early. Use for-of with await or Promise.all over mapped promises.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DEBUGGING",
    interviewWeight: 4,
    keyPoints:
      "forEach ignores returned promises\nDone logs before saves finish\nFix with for-of plus await\nOr Promise all over rows map for parallel saves",
    commonMisconceptions:
      "async forEach awaits each callback\nAdding await before forEach fixes it\nParallel and sequential are identical",
    followUpPrompt: "When would you pick sequential for-of over Promise.all?",
    followUpExpected:
      "When order, rate limits, or DB pressure require one at a time.",
  },
  {
    skillSlug: "typescript",
    topicSlug: "ts-generics-utility",
    title: "Typed pluck helper",
    prompt:
      "Write pluck(objs, key) that stays fully typed.\n```ts\nfunction pluck<T, K extends keyof T>(objs: T[], key: K): T[K][] {\n  // your code here\n}\n```",
    expectedAnswer:
      "Map over objs reading key, with K constrained to keyof T so the return infers as the field type.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 4,
    keyPoints:
      "K extends keyof T constrains the key\nReturn type T of K array preserves field type\nMap over objs reading the key\nCallers get autocomplete and errors for bad keys",
    commonMisconceptions:
      "any is fine for helpers\nConstraints weaken type safety\nGenerics run at runtime",
    followUpPrompt: "How would you type Omit with a union of keys?",
    followUpExpected:
      "Omit with Exclude of keyof T over the key union.",
  },
  {
    skillSlug: "react",
    topicSlug: "react-state-effects",
    title: "Infinite fetch loop",
    prompt:
      "This component fetches forever.\n```tsx\nuseEffect(() => { fetch('/api/cart').then(r => r.json()).then(setCart); });\n```\nWhy and what is the minimal fix?",
    expectedAnswer:
      "No dep array reruns the effect after every setCart render. Add an empty array, or key the effect by the real input.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DEBUGGING",
    interviewWeight: 4,
    keyPoints:
      "Missing dep array runs after every render\nsetCart triggers another render and fetch\nFix with an empty array or real deps\nAdd cleanup to ignore stale responses",
    commonMisconceptions:
      "Effects run once by default\nsetState never triggers effects\nEmpty array always means a bug",
    followUpPrompt: "When would you add a real dep instead of an empty array?",
    followUpExpected:
      "When the URL or user id drives the fetch.",
  },
  {
    skillSlug: "react",
    topicSlug: "react-performance",
    title: "Performance win story",
    prompt:
      "Tell me about a time you made a React app faster: what was slow, what you changed, and how you proved it.",
    expectedAnswer:
      "Name the symptom, the profiler evidence, the fix like state scope or virtualization, and the before-after numbers.",
    difficulty: "BEGINNER",
    category: "BEHAVIORAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 3,
    keyPoints:
      "Concrete slow interaction and its cause\nProfiler or timing evidence\nFix such as memo scope or virtualization\nBefore and after numbers",
    commonMisconceptions:
      "Vague claims without numbers convince\nPremature optimization everywhere helps\nTooling evidence does not matter",
    followUpPrompt: "What would you do if the fix had not worked?",
    followUpExpected:
      "Re-profile, slice by component, and test the next bottleneck.",
  },
  {
    skillSlug: "nextjs",
    topicSlug: "nextjs-server-client-caching",
    title: "Server-only import crash",
    prompt:
      "A 'use client' component imports a server-only db helper and the build fails. Diagnose and fix it.",
    expectedAnswer:
      "Client bundles cannot include server code. Move data reads to a Server Component and pass serializable props down.",
    difficulty: "ADVANCED",
    category: "TECHNICAL",
    format: "DEBUGGING",
    interviewWeight: 4,
    keyPoints:
      "Client bundle cannot include server modules\nMove reads to an async Server Component\nPass serializable props across the boundary\nKeep use client leaves small and low",
    commonMisconceptions:
      "use client can still import fs directly\nThe whole page must become client rendered\nProps can carry functions and sockets",
    followUpPrompt: "How do you share types without sharing code?",
    followUpExpected:
      "Shared type-only modules with no runtime imports.",
  },
  {
    skillSlug: "nextjs",
    topicSlug: "nextjs-middleware-auth",
    title: "Gate dashboard routes",
    prompt:
      "Design middleware protection for /dashboard: session checks, redirects, and edge constraints.",
    expectedAnswer:
      "Read the session cookie in middleware, redirect to login with a callback URL, and verify again in the route for sensitive data.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DESIGN",
    interviewWeight: 4,
    keyPoints:
      "Read and verify the session cookie in middleware\nRedirect to login with a return URL\nKeep middleware light for the edge\nRe-verify inside routes for sensitive reads",
    commonMisconceptions:
      "Middleware alone secures data fetching\nHeavy DB work belongs in middleware\nCookies never need verification",
    followUpPrompt: "Where do you enforce role checks?",
    followUpExpected:
      "In the route or server action after identity is known.",
  },
  {
    skillSlug: "backend",
    topicSlug: "backend-middleware-validation",
    title: "Validation middleware",
    prompt:
      "Write Express middleware that validates req.body with zod and returns 400 field errors.\n```ts\nimport { z } from 'zod';\nconst Signup = z.object({ email: z.string().email(), password: z.string().min(8) });\n// your middleware here\n```",
    expectedAnswer:
      "Safe-parse the body, call next on success, and return 400 with flattened field errors on failure.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 4,
    keyPoints:
      "Safe parse req body against the schema\nCall next only on success\nReturn 400 with field-level errors\nKeep validation at the boundary",
    commonMisconceptions:
      "Throwing without a handler returns 400\nFrontend checks replace server checks\nValidation belongs after the write",
    followUpPrompt: "How do you reuse this for many routes?",
    followUpExpected:
      "A higher-order validator that takes any schema.",
  },
  {
    skillSlug: "backend",
    topicSlug: "backend-background-jobs",
    title: "Email job queue",
    prompt:
      "Design a welcome-email pipeline for 100k signups a day: queue, retries, and failure handling.",
    expectedAnswer:
      "Enqueue on signup, process with idempotent workers, backoff retries, and a dead-letter queue with alerts.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "DESIGN",
    interviewWeight: 4,
    keyPoints:
      "Enqueue on signup and ack fast\nIdempotent workers with dedup keys\nExponential backoff with limited retries\nDead-letter queue plus alerts and replays",
    commonMisconceptions:
      "Send email inline in the request\nRetries never duplicate\nOne try is always enough",
    followUpPrompt: "How do you survive a provider outage?",
    followUpExpected:
      "Backpressure, paused consumers, and replayable backlog.",
  },
  {
    skillSlug: "postgresql",
    topicSlug: "pg-transactions",
    title: "Double-booked seats",
    prompt:
      "Two transactions both read 1 seat left and both insert bookings. Explain the anomaly and fix it with SQL.",
    expectedAnswer:
      "The read-check-write raced. Use a transaction with SELECT FOR UPDATE or a guarded UPDATE so only one booking commits.",
    difficulty: "ADVANCED",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 4,
    keyPoints:
      "Concurrent reads both saw one seat\nFix with SELECT FOR UPDATE in a transaction\nOr guarded UPDATE with row count check\nUnique constraints as a backstop",
    commonMisconceptions:
      "READ COMMITTED alone prevents this\nApp-level checks are enough\nMore indexes fix races",
    followUpPrompt: "When would you use SERIALIZABLE here?",
    followUpExpected:
      "When multi-row invariants must look sequential under contention.",
  },
  {
    skillSlug: "system-design",
    topicSlug: "sys-caching-cdn",
    title: "Cache product pages",
    prompt:
      "Design caching for 1M product pages with daily price changes: layers, TTLs, and invalidation.",
    expectedAnswer:
      "Cache page fragments at the CDN with short TTLs, use cache-aside for product data, and invalidate by key on price writes with stale-while-revalidate.",
    difficulty: "INTERMEDIATE",
    category: "SYSTEM_DESIGN",
    format: "DESIGN",
    interviewWeight: 4,
    keyPoints:
      "CDN for static fragments with short TTLs\nCache-aside for product reads\nInvalidate by key on price writes\nStale-while-revalidate to avoid stampedes",
    commonMisconceptions:
      "Cache everything forever\nInvalidation is free and instant\nTTL alone handles price accuracy",
    followUpPrompt: "How do you handle a flash sale spike?",
    followUpExpected:
      "Pre-warm, longer TTLs, and single-flight rebuilds.",
  },
  {
    skillSlug: "system-design",
    topicSlug: "sys-queues",
    title: "Queue lag at checkout",
    prompt:
      "During a flash sale the order queue lags 20 minutes and the DB saturates. Walk through mitigation and redesign.",
    expectedAnswer:
      "Shed load with backpressure and cached reads, drain with autoscaled consumers, then add partitioning, idempotency, and circuit breakers.",
    difficulty: "ADVANCED",
    category: "SYSTEM_DESIGN",
    format: "SCENARIO",
    interviewWeight: 5,
    keyPoints:
      "Mitigate with load shedding and stale reads\nScale consumers and partition the queue\nIdempotent workers with dead-letter handling\nCircuit breakers and runbooks for next time",
    commonMisconceptions:
      "More retries always drain faster\nOne partition scales forever\nExactly-once is free",
    followUpPrompt: "How do you avoid losing orders during the fix?",
    followUpExpected:
      "Durable queue with acks and replayable backlog.",
  },
  {
    skillSlug: "dsa",
    topicSlug: "dsa-trees-graphs",
    title: "Shortest path in a graph",
    prompt:
      "Write bfsShortestPath(graph, start, end) returning the hop count or -1.\n```js\nfunction bfsShortestPath(graph, start, end) {\n  // graph: Record<string, string[]>; your code here\n}\n```",
    expectedAnswer:
      "BFS level by level with a visited set and queue gives O(V + E); the first visit to end is the shortest path.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 4,
    keyPoints:
      "Queue plus visited set avoids repeats\nExpand level by level for shortest hops\nReturn depth when end is dequeued\nO(V + E) time and O(V) space",
    commonMisconceptions:
      "DFS also gives shortest paths\nVisited sets are optional\nBFS is always O(1)",
    followUpPrompt: "How would you return the actual path?",
    followUpExpected:
      "Track parents and walk back from end to start.",
  },
  {
    skillSlug: "ai-engineering",
    topicSlug: "aieng-chunking-embeddings",
    title: "Chunking for support docs",
    prompt:
      "Explain how you would chunk 10k support articles for RAG: size, overlap, metadata, and how you validate it.",
    expectedAnswer:
      "Chunk by section around 500 tokens with overlap, attach metadata filters, use hybrid search with rerank, and A/B recall on real questions.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "TECHNICAL_EXPLANATION",
    interviewWeight: 4,
    keyPoints:
      "Section-aware chunks around 500 tokens\nOverlap to preserve split context\nMetadata for product and version filters\nValidate with recall on real questions",
    commonMisconceptions:
      "Whole docs always retrieve best\nChunking needs no evaluation\nMetadata never helps",
    followUpPrompt: "What do you do when tables split across chunks?",
    followUpExpected:
      "Keep tables whole or attach neighboring context.",
  },
  {
    skillSlug: "ai-engineering",
    topicSlug: "aieng-agents-cost",
    title: "Runaway agent spend",
    prompt:
      "A research agent loops over tools and burns $500 overnight with no guardrails. How do you control cost and latency?",
    expectedAnswer:
      "Cap steps and spend, require tool allowlists and confirmations, cache and summarize context, and alert on budget burn.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "SCENARIO",
    interviewWeight: 4,
    keyPoints:
      "Max steps tokens and dollar budget per run\nTool allowlists with confirmations for writes\nCache results and summarize context\nAlerts and kill switches on burn rate",
    commonMisconceptions:
      "More steps always mean better answers\nCost controls hurt quality by default\nLogs alone prevent loops",
    followUpPrompt: "How do you keep quality after capping steps?",
    followUpExpected:
      "Eval set on task success plus scoped sub-agents.",
  },
  {
    skillSlug: "ai-evaluation",
    topicSlug: "aieval-eval-sets-regressions",
    title: "Build an eval harness",
    prompt:
      "Write a minimal eval runner that grades model outputs against expected answers.\n```ts\nasync function runEvals(cases: { input: string; expected: string }[], solve: (i: string) => Promise<string>) {\n  // your code here: return { passRate: number; failures: unknown[] }\n}\n```",
    expectedAnswer:
      "Loop cases with fixed seeds, normalize and compare outputs, collect failures with inputs, and return the pass rate.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 3,
    keyPoints:
      "Fixed inputs and seeds for repeatability\nNormalize outputs before comparing\nCollect failures with inputs and diffs\nReturn pass rate plus failure list",
    commonMisconceptions:
      "One aggregate score is enough\nRandom live data makes good evals\nFailures need no stored examples",
    followUpPrompt: "How do you grade open-ended answers?",
    followUpExpected:
      "Rubric judge with agreement checks on samples.",
  },
  {
    skillSlug: "ai-evaluation",
    topicSlug: "aieval-metrics",
    title: "Score a classifier",
    prompt:
      "Write precision and recall for binary labels, then explain when you optimize each.\n```ts\nfunction pr(yTrue: number[], yPred: number[]): { precision: number; recall: number } {\n  // your code here\n}\n```",
    expectedAnswer:
      "Precision is true positives over predicted positives and recall over actual positives; optimize precision for spam flags and recall for disease screening.",
    difficulty: "INTERMEDIATE",
    category: "TECHNICAL",
    format: "CODING",
    interviewWeight: 3,
    keyPoints:
      "Count true positives false positives false negatives\nPrecision over predicted positives\nRecall over actual positives\nChoose by cost of each error type",
    commonMisconceptions:
      "Accuracy suffices for rare classes\nPrecision and recall are the same\nThresholds never matter",
    followUpPrompt: "How do you pick the threshold?",
    followUpExpected:
      "Sweep it against the cost-weighted F score.",
  },
];
