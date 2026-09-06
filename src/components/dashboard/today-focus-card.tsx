import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TodayFocus } from "@/features/dashboard/queries";
import { bandLabel } from "@/lib/format";

export function TodayFocusCard({ focus }: { focus: TodayFocus }): React.JSX.Element {
  const { recommendation, question } = focus;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s focus</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="text-lg font-semibold">{recommendation.topicName}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="secondary">{recommendation.skillName}</Badge>
            <Badge variant="outline">{recommendation.focusLabel}</Badge>
            <Badge variant="outline">{bandLabel(recommendation.masteryBand)}</Badge>
          </div>
        </div>
        <p className="text-sm">
          <span className="font-medium">Why: </span>
          {recommendation.reasonSummary}
        </p>
        <p className="text-sm">
          <span className="font-medium">Task: </span>
          {recommendation.recommendedTask}
        </p>
        <p className="text-sm text-muted-foreground">
          Estimated {recommendation.estimatedMinutes} min
        </p>
        {question ? (
          <div>
            <Button type="button" render={<Link href={`/tasks/${question.id}`} />}>
              Start task
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No questions in this topic yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
