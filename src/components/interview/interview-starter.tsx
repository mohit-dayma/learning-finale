"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  InterviewFilters,
  InterviewStats,
} from "@/features/interview/queries";
import type {
  InterviewFormatKind,
  InterviewQueueItem,
  InterviewSkillCategory,
} from "@/features/interview/types";

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function InterviewStarter({
  filters,
  queue,
  stats,
}: {
  filters: InterviewFilters;
  queue: InterviewQueueItem[];
  stats: InterviewStats;
}): React.JSX.Element {
  const [skillSlug, setSkillSlug] = useState<InterviewSkillCategory | null>(null);
  const [format, setFormat] = useState<InterviewFormatKind | null>(null);

  const filtered = useMemo(
    () =>
      queue.filter(
        (item) =>
          (skillSlug === null || item.skillSlug === skillSlug) &&
          (format === null || item.format === format),
      ),
    [queue, skillSlug, format],
  );
  const first = filtered[0] ?? null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interview stats</CardTitle>
          <CardDescription>
            {stats.totalQuestions} questions · {stats.attemptedQuestions} attempted
            {" · "}correct rate {formatRate(stats.correctRate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.perSkill.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {stats.perSkill.map((skill) => (
                <li key={skill.skillSlug}>
                  <Badge variant="secondary">
                    {skill.skillName} · {skill.attempted}/{skill.questions} ·{" "}
                    {formatRate(skill.rate)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No interview questions yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pick a focus</CardTitle>
          <CardDescription>
            Filter by skill and format, then start with the top pick. Weak
            areas and high-importance questions surface first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Skill</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={skillSlug === null ? "default" : "outline"}
                onClick={() => setSkillSlug(null)}
              >
                All
              </Button>
              {filters.categories.map((category) => (
                <Button
                  key={category.slug}
                  type="button"
                  size="sm"
                  variant={skillSlug === category.slug ? "default" : "outline"}
                  onClick={() =>
                    setSkillSlug(category.slug as InterviewSkillCategory)
                  }
                >
                  {category.name} · {category.count}
                </Button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Format</span>
            <select
              className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
              value={format ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormat(
                  value === "TECHNICAL_EXPLANATION" ||
                    value === "CODING" ||
                    value === "DEBUGGING" ||
                    value === "DESIGN" ||
                    value === "SCENARIO"
                    ? value
                    : null,
                );
              }}
            >
              <option value="">All formats</option>
              {filters.formats.map((option) => (
                <option key={option.format} value={option.format}>
                  {option.label} · {option.count}
                </option>
              ))}
            </select>
          </label>

          {first ? (
            <Button type="button" render={<Link href={`/interview/${first.id}`} />}>
              Start random interview
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No questions match these filters.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-base font-medium">Up next</h2>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing in the queue. Adjust the filters above.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/interview/${item.id}`}
                  className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="default">{item.skillName}</Badge>
                    <Badge variant="outline">{item.difficulty}</Badge>
                    <Badge variant="outline">{item.format}</Badge>
                    {item.whyPicked.map((reason) => (
                      <Badge key={reason} variant="secondary">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
