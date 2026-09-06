import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressSummary } from "@/features/dashboard/queries";
import { formatDateTime, formatMinutes } from "@/lib/format";

export function ProgressCard({ progress }: { progress: ProgressSummary }): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Last 7 days: {progress.sessionsLast7Days} sessions · {progress.answersLast7Days} answers ·{" "}
          {formatMinutes(progress.minutesLast7Days)} studied
        </p>
        {progress.recentSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions yet. Start today&apos;s focus task.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {progress.recentSessions.map((session) => (
              <li
                key={session.id}
                className="flex flex-col gap-1 border-t pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{formatDateTime(session.startedAt)}</span>
                  <span className="text-sm text-muted-foreground">
                    {session.skillName ?? "General"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.correctAnswers}/{session.totalAnswers} correct ·{" "}
                  {session.minutes !== null ? formatMinutes(session.minutes) : "in progress"}
                  {session.status !== "COMPLETED" ? ` · ${session.status}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
