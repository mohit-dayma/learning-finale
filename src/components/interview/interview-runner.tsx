"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InterviewFeedback } from "@/components/interview/interview-feedback";
import {
  submitInterviewAnswer,
  type SubmitInterviewAnswerResult,
} from "@/features/interview/actions";
import type { InterviewDetail } from "@/features/interview/types";

const MAX_ANSWER_LENGTH = 5000;

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return "Something went wrong. Try again.";
}

function isCodeLike(format: string): boolean {
  return format === "CODING" || format === "DEBUGGING";
}

export function InterviewRunner({
  detail,
  nextQuestionId,
}: {
  detail: InterviewDetail;
  nextQuestionId: string | null;
}): React.JSX.Element {
  const [userAnswer, setUserAnswer] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitInterviewAnswerResult | null>(null);

  async function handleSubmit(wasCorrect: boolean) {
    if (result || pending) return;
    if (userAnswer.trim().length === 0) {
      setError("Write your answer from memory first.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await submitInterviewAnswer({
        questionId: detail.id,
        userAnswer,
        wasCorrect,
      });
      setResult(res);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{detail.skillName}</Badge>
            {detail.topicName ? (
              <Badge variant="secondary">{detail.topicName}</Badge>
            ) : null}
            <Badge variant="outline">{detail.difficulty}</Badge>
            <Badge variant="outline">{detail.format}</Badge>
            {detail.whyPicked.map((reason) => (
              <Badge key={reason} variant="secondary">
                {reason}
              </Badge>
            ))}
          </div>
          <CardTitle>{detail.title}</CardTitle>
          <CardDescription>
            Answer from memory. The expected answer appears only after you submit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isCodeLike(detail.format) ? (
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {detail.prompt}
            </pre>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {detail.prompt}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Attempt {detail.attemptCount + 1}
            {detail.lastWasCorrect !== null
              ? ` · last: ${detail.lastWasCorrect ? "correct" : "incorrect"}`
              : null}
          </p>
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-4">
          <div
            className={
              result.isCorrect
                ? "rounded-xl border border-green-500/40 bg-green-500/10 p-4 text-sm"
                : "rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
            }
          >
            <p className="font-medium">
              {result.isCorrect ? "Marked correct." : "Marked incorrect."}
            </p>
            {result.suggestedCorrect !== result.isCorrect ? (
              <p className="mt-1 text-muted-foreground">
                Auto-check suggested:{" "}
                {result.suggestedCorrect ? "looks correct" : "needs work"}.
              </p>
            ) : null}
          </div>

          <InterviewFeedback feedback={result} />

          <div className="flex flex-wrap gap-2">
            {nextQuestionId ? (
              <Button type="button" render={<Link href={`/interview/${nextQuestionId}`} />}>
                Next random question
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              render={<Link href="/interview" />}
            >
              Back to interview
            </Button>
            <Button
              type="button"
              variant="ghost"
              render={<Link href="/dashboard" />}
            >
              Back to dashboard
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your answer</CardTitle>
            <CardDescription>
              Write your answer, then mark yourself honestly — this drives your
              review schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                Write your answer from memory
              </span>
              <textarea
                className="min-h-32 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
                placeholder="Explain it like you would to an interviewer…"
                required
                minLength={1}
                maxLength={MAX_ANSWER_LENGTH}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              {userAnswer.length}/{MAX_ANSWER_LENGTH}
            </p>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={pending}
                onClick={() => handleSubmit(true)}
              >
                {pending ? "Submitting…" : "I got it right"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => handleSubmit(false)}
              >
                {pending ? "Submitting…" : "I got it wrong"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
