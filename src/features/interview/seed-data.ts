// Interview seed questions (wired into prisma/seed.ts by the main agent).
//
// 20 questions covering all 10 skill categories (>= 2 each) and all 5
// formats (>= 1 each). topicSlug uses existing topic slugs where possible;
// system-design / ai-engineering / ai-evaluation use topicSlug null (the
// main agent creates those skills/topics).

export interface InterviewSeedQuestion {
  skillSlug: string;
  topicSlug: string | null;
  title: string;
  prompt: string;
  expectedAnswer: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  category: "TECHNICAL" | "SYSTEM_DESIGN";
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
];
