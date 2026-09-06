"use client";

import { Button } from "@/components/ui/button";

export default function CareerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Career tracker</h1>
        <p className="text-sm">Something went wrong loading the career tracker.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </main>
    </div>
  );
}
