import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InterviewFeedback as InterviewFeedbackData } from "@/features/interview/types";

function EmptyNote({ text }: { text: string }): React.JSX.Element {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

/** Presentational post-submit breakdown (no client state, no actions). */
export function InterviewFeedback({
  feedback,
}: {
  feedback: InterviewFeedbackData;
}): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Expected answer</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.expectedAnswer ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {feedback.expectedAnswer}
            </p>
          ) : (
            <EmptyNote text="No expected answer was provided for this question yet." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What was correct</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.whatCorrect.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {feedback.whatCorrect.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <EmptyNote text="None of the key points were covered. Compare your answer with the expected answer above." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What was missed</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.whatMissed.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {feedback.whatMissed.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <EmptyNote text="Nothing missed — every key point was covered." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Misconceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.misconceptions.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {feedback.misconceptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <EmptyNote text="No common misconceptions recorded for this question." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-up question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.followUpPrompt ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {feedback.followUpPrompt}
            </p>
          ) : (
            <EmptyNote text="No follow-up question for this prompt." />
          )}
          {feedback.followUpExpected ? (
            <details className="rounded-lg border border-border px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium">
                Show follow-up answer
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {feedback.followUpExpected}
              </p>
            </details>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
