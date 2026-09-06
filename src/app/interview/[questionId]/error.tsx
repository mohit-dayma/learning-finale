"use client";

import { Button } from "@/components/ui/button";

export default function InterviewQuestionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-4 rounded-xl border border-border p-6">
        <p className="text-sm">
          {error.message.length > 0
            ? error.message
            : "Could not load this interview question."}
        </p>
        <Button type="button" variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
