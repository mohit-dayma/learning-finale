// Weekly rotation: which skills are in focus each day.
// Deterministic, timezone-safe: callers pass the date explicitly.

export const ALL_SKILL_SLUGS = [
  "javascript",
  "typescript",
  "react",
  "nextjs",
  "dsa",
  "backend",
  "postgresql",
  "ai",
] as const;

export type SkillSlug = (typeof ALL_SKILL_SLUGS)[number] | string;

const ROTATION: Record<number, { label: string; skills: string[] }> = {
  // getDay(): 0 = Sunday
  0: { label: "Review / interview preparation / career", skills: [] },
  1: { label: "JavaScript / TypeScript", skills: ["javascript", "typescript"] },
  2: { label: "React / Next.js", skills: ["react", "nextjs"] },
  3: { label: "DSA", skills: ["dsa"] },
  4: { label: "AI engineering / AI evaluation", skills: ["ai"] },
  5: {
    label: "Backend / Database / Security / Production",
    skills: ["backend", "postgresql"],
  },
  6: { label: "Practical engineering", skills: [] },
};

export function getDayTheme(date: Date): { day: number; dayName: string; label: string } {
  const day = date.getDay();
  const entry = ROTATION[day] ?? { label: "Review", skills: [] };
  const names = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ] as const;
  return { day, dayName: names[day] ?? "Unknown", label: entry.label };
}

/**
 * Skill slugs in focus for the given date.
 * Empty array means "no skill filter":
 * - Saturday (practical): any skill, pick by need.
 * - Sunday (review): any skill, pick by due reviews/mistakes.
 */
export function getFocusSkills(date: Date): string[] {
  const day = date.getDay();
  return [...(ROTATION[day]?.skills ?? [])];
}

export function isOpenDay(date: Date): boolean {
  return getFocusSkills(date).length === 0;
}
