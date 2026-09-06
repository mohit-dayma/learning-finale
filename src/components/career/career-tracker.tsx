"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApplicationCard } from "./application-card";
import { ApplicationForm } from "./application-form";
import type { CareerItem, CareerStats } from "@/features/career/queries";
import type { ApplicationStatus } from "@/generated/prisma/enums";

type Filter = "ALL" | ApplicationStatus;

const FILTERS: Filter[] = [
  "ALL",
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ACCEPTED",
];

export function CareerTracker({
  initialItems,
  stats,
}: {
  initialItems: CareerItem[];
  stats: CareerStats;
}): React.JSX.Element {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");

  const items = useMemo(() => {
    if (filter === "ALL") return initialItems;
    return initialItems.filter((item) => item.status === filter);
  }, [initialItems, filter]);

  function handleChanged(): void {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {stats.total} total · {stats.interviewing} interviewing · {stats.offers} offers
      </p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => {
          const count =
            value === "ALL"
              ? stats.total
              : (stats.byStatus[value] ?? 0);
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-lg bg-primary px-2.5 py-1.5 text-sm font-medium text-primary-foreground"
                  : "rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              }
            >
              {value === "ALL" ? "All" : value} ({count})
            </button>
          );
        })}
      </div>

      <ApplicationForm onCreated={handleChanged} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No applications yet. Add your first one above.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <ApplicationCard key={item.id} item={item} onChanged={handleChanged} />
          ))}
        </div>
      )}
    </div>
  );
}
