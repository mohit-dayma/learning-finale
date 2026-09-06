// Scenario checks for the deterministic recommendation engine.
// Run: pnpm dlx tsx src/features/learning-engine/verify-recommendation.ts
// Throws on the first failed expectation; prints each pick on success.

import { recommendToday } from "./recommend";
import { updateMasteryScore, canMarkMastered, scoreToBand } from "./mastery";
import { getFocusSkills } from "./rotation";
import type { TopicSignal } from "./types";

function base(topic: Partial<TopicSignal> & { topicSlug: string }): TopicSignal {
  return {
    topicId: `id-${topic.topicSlug}`,
    topicSlug: topic.topicSlug,
    topicName: topic.topicName ?? topic.topicSlug,
    skillSlug: topic.skillSlug ?? "react",
    skillName: topic.skillName ?? topic.skillSlug ?? "react",
    masteryScore: topic.masteryScore ?? 50,
    attempts: topic.attempts ?? 5,
    recentAccuracy: topic.recentAccuracy ?? 0.7,
    correctStreak: topic.correctStreak ?? 0,
    dueReviewsCount: topic.dueReviewsCount ?? 0,
    overdueDays: topic.overdueDays ?? 0,
    unresolvedMistakes: topic.unresolvedMistakes ?? 0,
    recentMistakeCount: topic.recentMistakeCount ?? 0,
    aiDependence: topic.aiDependence ?? 0,
    interviewWeight: topic.interviewWeight ?? 0.5,
    lastStudiedAt: topic.lastStudiedAt ?? new Date("2026-08-20T00:00:00Z"),
  };
}

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`ok - ${message}`);
}

// Monday 2026-09-07 is a Monday (JS/TS focus).
const MON = new Date("2026-09-07T09:00:00Z");
const TUE = new Date("2026-09-08T09:00:00Z");
const WED = new Date("2026-09-09T09:00:00Z");
const SUN = new Date("2026-09-13T09:00:00Z");

// 1. Rotation mapping works.
expect(getFocusSkills(MON).join(",") === "javascript,typescript", "Monday focuses JS/TS");
expect(getFocusSkills(TUE).join(",") === "react,nextjs", "Tuesday focuses React/Next.js");
expect(getFocusSkills(WED).join(",") === "dsa", "Wednesday focuses DSA");
expect(getFocusSkills(SUN).length === 0, "Sunday has no skill filter (review mode)");

// 2. Weak topics are prioritized.
{
  const rec = recommendToday(
    [
      base({ topicSlug: "js-weak", topicName: "Weak JS", skillSlug: "javascript", masteryScore: 10, recentAccuracy: 0.4 }),
      base({ topicSlug: "js-strong", topicName: "Strong JS", skillSlug: "javascript", masteryScore: 65, recentAccuracy: 0.9 }),
    ],
    MON,
  );
  expect(rec?.topicSlug === "js-weak", `weak topic wins (got ${rec?.topicSlug})`);
}

// 3. Due reviews beat slightly weaker mastery.
{
  const rec = recommendToday(
    [
      base({ topicSlug: "r-yellow", topicName: "Yellow, no dues", skillSlug: "react", masteryScore: 35 }),
      base({ topicSlug: "r-green-due", topicName: "Green with dues", skillSlug: "react", masteryScore: 60, dueReviewsCount: 2, overdueDays: 4 }),
    ],
    TUE,
  );
  expect(rec?.topicSlug === "r-green-due", `due reviews win (got ${rec?.topicSlug})`);
  expect(rec?.reasons.includes("due-review") === true, "reason lists due-review");
}

// 4. Recent mistakes affect recommendations.
{
  const plain = recommendToday(
    [
      base({ topicSlug: "a-clean", skillSlug: "dsa", masteryScore: 40 }),
      base({ topicSlug: "b-mistakes", skillSlug: "dsa", masteryScore: 40, unresolvedMistakes: 2, recentMistakeCount: 2 }),
    ],
    WED,
  );
  expect(plain?.topicSlug === "b-mistakes", `mistakes win tie (got ${plain?.topicSlug})`);
}

// 5. Rotation filters out-of-focus skills.
{
  const rec = recommendToday(
    [
      base({ topicSlug: "js-red", skillSlug: "javascript", masteryScore: 5, recentAccuracy: 0.3 }),
      base({ topicSlug: "dsa-green", skillSlug: "dsa", masteryScore: 60, recentAccuracy: 0.8 }),
    ],
    WED,
  );
  expect(rec?.topicSlug === "dsa-green", `Wednesday picks DSA over weaker JS (got ${rec?.topicSlug})`);
}

// 6. Mastered topics are not repeatedly selected.
{
  const rec = recommendToday(
    [
      base({ topicSlug: "js-mastered", skillSlug: "javascript", masteryScore: 95, attempts: 20, recentAccuracy: 1 }),
      base({ topicSlug: "ts-weak", skillSlug: "typescript", masteryScore: 15, recentAccuracy: 0.4 }),
    ],
    MON,
  );
  expect(rec?.topicSlug === "ts-weak", `mastered skipped (got ${rec?.topicSlug})`);
  expect(rec?.masteryBand !== "MASTERED", "pick is not MASTERED band");
}

// 7. Sunday review mode picks most due across all skills.
{
  const rec = recommendToday(
    [
      base({ topicSlug: "js-fine", skillSlug: "javascript", masteryScore: 55 }),
      base({ topicSlug: "ai-overdue", skillSlug: "ai", masteryScore: 55, dueReviewsCount: 3, overdueDays: 6, unresolvedMistakes: 1, recentMistakeCount: 1 }),
    ],
    SUN,
  );
  expect(rec?.topicSlug === "ai-overdue", `Sunday picks most overdue (got ${rec?.topicSlug})`);
}

// 8. One answer never grants MASTERED.
{
  const next = updateMasteryScore({ currentScore: 85, isCorrect: true, attempts: 3 });
  expect(next < 90, `85 + correct stays below 90 (got ${next})`);
  expect(scoreToBand(0) === "RED", "0 maps to RED");
  expect(scoreToBand(95) === "MASTERED", "95 maps to MASTERED");
  const elig = canMarkMastered({ score: 95, attempts: 1, recentAccuracy: 1, unresolvedMistakes: 0, dueReviewsCount: 0 });
  expect(elig.eligible === false, "single attempt cannot be MASTERED-eligible");
}

// 9. AI dependence + interview weight break ties deterministically.
{
  const rec = recommendToday(
    [
      base({ topicSlug: "a-normal", skillSlug: "dsa", masteryScore: 40, aiDependence: 0, interviewWeight: 0.2 }),
      base({ topicSlug: "b-aineedy", skillSlug: "dsa", masteryScore: 40, aiDependence: 0.9, interviewWeight: 1 }),
    ],
    WED,
  );
  expect(rec?.topicSlug === "b-aineedy", `AI/interview signals win tie (got ${rec?.topicSlug})`);
}

// 10. Determinism: same input twice -> same output.
{
  const topics = [
    base({ topicSlug: "b-topic", skillSlug: "dsa", masteryScore: 40 }),
    base({ topicSlug: "a-topic", skillSlug: "dsa", masteryScore: 40 }),
  ];
  const r1 = recommendToday(topics, WED);
  const r2 = recommendToday(topics, WED);
  expect(r1?.topicSlug === r2?.topicSlug, "recommendation is deterministic");
  expect(r1?.topicSlug === "a-topic", `tie breaks by slug (got ${r1?.topicSlug})`);
}

console.log("\nAll recommendation scenarios passed.");
