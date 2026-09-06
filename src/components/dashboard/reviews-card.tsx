import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewsSummary } from "@/features/dashboard/queries";

export function ReviewsCard({ reviews }: { reviews: ReviewsSummary }): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {reviews.dueToday} due today · {reviews.overdue} overdue
        </p>
        {reviews.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews due. New reviews appear when you answer questions incorrectly.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 border-t pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{item.topicName}</span>
                  <span className="text-sm text-muted-foreground">{item.skillName}</span>
                  {item.isOverdue ? (
                    <Badge variant="destructive">
                      {item.overdueDays > 0 ? `overdue by ${item.overdueDays}d` : "overdue"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">due today</Badge>
                  )}
                </div>
                {item.promptSnippet ? (
                  <p className="text-sm text-muted-foreground">{item.promptSnippet}</p>
                ) : null}
                {item.questionId ? (
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      render={<Link href={`/tasks/${item.questionId}`} />}
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
