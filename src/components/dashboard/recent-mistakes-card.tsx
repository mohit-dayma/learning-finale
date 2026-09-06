import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MistakeItem } from "@/features/dashboard/queries";
import { timeAgo } from "@/lib/format";

export function RecentMistakesCard({ mistakes }: { mistakes: MistakeItem[] }): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent mistakes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {mistakes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open mistakes. Wrong answers with a note land here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mistakes.map((mistake) => (
              <li
                key={mistake.id}
                className="flex flex-col gap-1 border-t pt-3 first:border-t-0 first:pt-0"
              >
                <p className="text-sm">{mistake.note}</p>
                <p className="text-sm text-muted-foreground">
                  {mistake.topicName} · {mistake.skillName} · {timeAgo(mistake.createdAt)}
                </p>
                {mistake.questionId ? (
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      render={<Link href={`/tasks/${mistake.questionId}`} />}
                    >
                      Practice
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
