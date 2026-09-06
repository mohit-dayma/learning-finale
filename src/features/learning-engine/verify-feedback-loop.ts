// Feedback-loop scenario checks (pure logic, no DB).
// Run: pnpm dlx tsx src/features/learning-engine/verify-feedback-loop.ts
// Throws on the first failed expectation; prints each pick on success.

import { processAttempt } from "./feedback-loop";
import { intervalForGrade } from "./review-schedule";
import { averageAiDependence, needsIndependentPractice } from "./ai-dependence";
import { buildMistakeRecord, sortMistakesByPriority } from "./mistake-log";
import { updateMasteryScore, scoreToBand } from "./mastery";

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`ok - ${message}`);
}

const NOW = new Date("2026-09-06T09:00:00Z");

// 1. Review intervals match the spec: 1 / 3 / 7 / 14 / 30 days.
expect(intervalForGrade("HARD") === 1, "HARD reviews in 1 day");
expect(intervalForGrade("NEEDS_WORK") === 3, "NEEDS_WORK reviews in 3 days");
expect(intervalForGrade("GOOD") === 7, "GOOD reviews in 7 days");
expect(intervalForGrade("STRONG") === 14, "STRONG reviews in 14 days");
expect(intervalForGrade("MASTERED") === 30, "MASTERED reviews in 30 days");

// 2. One correct answer never produces MASTERED.
{
  const out = processAttempt({
    kind: "choice",
    selectedOptionId: "a",
    correctOptionId: "a",
    aiLevel: "INDEPENDENT",
    currentScore: 85,
    topicAttempts: 1,
    correctStreak: 0,
    recentAccuracy: 1,
    unresolvedMistakes: 0,
    dueReviewsCount: 0,
    recentAiLevels: [],
    now: NOW,
  });
  expect(out.evaluation.isCorrect, "correct choice evaluates correct");
  expect(out.nextScore < 90, `single correct stays below 90 (got ${out.nextScore})`);
  expect(out.band !== "MASTERED", "single correct never yields MASTERED band");
  expect(out.masteredEligible === false, "single attempt not MASTERED-eligible");
  expect(out.reviewPlan.intervalDays === 7, `correct schedules 7d review (got ${out.reviewPlan.intervalDays})`);
  expect(out.mistake === null, "correct answer logs no mistake");
}

// 3. Wrong answer: HARD grade, 1-day review, mistake logged with severity.
{
  const out = processAttempt({
    kind: "choice",
    selectedOptionId: "a",
    correctOptionId: "b",
    aiLevel: "INDEPENDENT",
    currentScore: 50,
    topicAttempts: 4,
    correctStreak: 2,
    recentAccuracy: 0.6,
    unresolvedMistakes: 0,
    dueReviewsCount: 0,
    recentAiLevels: [],
    now: NOW,
    mistakeContext: {
      question: "What is a closure?",
      userAnswer: "a",
      correctAnswer: "b",
      explanation: "A closure captures variables.",
      whyWrong: "Confused with scope.",
      mentalModel: "Closure = function + captured env.",
      priorWrongCount: 0,
    },
  });
  expect(!out.evaluation.isCorrect, "wrong choice evaluates wrong");
  expect(out.refinedGrade === "HARD", `wrong grades HARD (got ${out.refinedGrade})`);
  expect(out.reviewPlan.intervalDays === 1, "wrong schedules 1-day review");
  expect(out.mistake !== null, "wrong answer creates a mistake record");
  expect(out.mistake?.question === "What is a closure?", "mistake keeps the question");
  expect(out.mistake?.userAnswer === "a", "mistake keeps the user answer");
  expect(out.mistake?.correctAnswer === "b", "mistake keeps the correct answer");
  expect(out.mistake?.severity === "LOW", `first repeat is LOW (got ${out.mistake?.severity})`);
}

// 4. Repeated mistakes escalate severity and sort first.
{
  const first = buildMistakeRecord({
    question: "Q",
    userAnswer: "wrong",
    correctAnswer: "right",
    explanation: "E",
    whyWrong: "guess",
    mentalModel: "rule",
    priorWrongCount: 0,
    grade: "HARD",
    now: NOW,
  });
  const fourth = buildMistakeRecord({
    question: "Q",
    userAnswer: "wrong",
    correctAnswer: "right",
    explanation: "E",
    whyWrong: "guess again",
    mentalModel: "rule",
    priorWrongCount: 3,
    grade: "HARD",
    now: NOW,
  });
  expect(first.severity === "LOW", "1st repeat is LOW");
  expect(fourth.severity === "CRITICAL", `4th repeat is CRITICAL (got ${fourth.severity})`);
  expect(fourth.priority > first.priority, "repeats get higher priority");
  const sorted = sortMistakesByPriority([first, fourth]);
  expect(sorted[0]?.severity === "CRITICAL", "chronic mistake sorts first");
}

// 5. Repeated AI dependency forces independent practice.
{
  const dep = averageAiDependence(["AI_MOST", "AI_MOST", "CANNOT_EXPLAIN"]);
  expect(dep > 0.6, `heavy AI use scores above 0.6 (got ${dep})`);
  expect(needsIndependentPractice(["AI_MOST", "AI_MOST", "CANNOT_EXPLAIN"]), "heavy AI use needs independent practice");
  expect(!needsIndependentPractice(["INDEPENDENT", "INDEPENDENT", "HINT"]), "independent work needs no forcing");
  const out = processAttempt({
    kind: "self-mark",
    selfMarkedCorrect: true,
    aiLevel: "AI_MOST",
    currentScore: 60,
    topicAttempts: 5,
    correctStreak: 3,
    recentAccuracy: 0.9,
    unresolvedMistakes: 0,
    dueReviewsCount: 0,
    recentAiLevels: ["AI_MOST", "AI_MOST"],
    now: NOW,
  });
  expect(out.forceIndependentPractice, "repeated AI dependency flags independent practice");
  expect(out.nextStep.includes("independent"), "next step mentions independent practice");
}

// 6. Mastery bands move with repeated performance, never one jump.
{
  let score = 0;
  for (let i = 0; i < 5; i += 1) {
    score = updateMasteryScore({ currentScore: score, isCorrect: true, attempts: i + 1 });
  }
  expect(scoreToBand(score) === "YELLOW" || scoreToBand(score) === "GREEN", `5 correct climbs gradually (score ${score})`);
  const dropped = updateMasteryScore({ currentScore: score, isCorrect: false, attempts: 6 });
  expect(dropped < score, "wrong answer lowers mastery");
}

console.log("\nAll feedback-loop scenarios passed.");
