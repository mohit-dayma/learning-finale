import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeakTopic } from "@/features/dashboard/queries";
import type { MasteryBand } from "@/features/learning-engine";
import { formatPercent } from "@/lib/format";

function bandLabel(band: MasteryBand): string {
  switch (band) {
    case "RED":
      return "Weak";
    case "YELLOW":
      return "Developing";
    case "GREEN":
      return "Solid";
    case "BLUE":
      return "Strong";
    case "MASTERED":
      return "Mastered";
  }
}

export function WeakAreasCard({ areas }: { areas: WeakTopic[] }): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weak areas</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {areas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Answer questions to discover your weak areas.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {areas.map((area) => (
              <li
                key={area.topicId}
                className="flex flex-col gap-1 border-t pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{area.topicName}</span>
                  <span className="text-sm text-muted-foreground">{area.skillName}</span>
                  <Badge variant="outline">{bandLabel(area.band)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  score {area.masteryScore}/100 · {formatPercent(area.recentAccuracy)} correct ·{" "}
                  {area.attempts} attempts
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
