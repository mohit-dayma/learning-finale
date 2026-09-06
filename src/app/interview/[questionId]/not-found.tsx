import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InterviewQuestionNotFound(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-4 rounded-xl border border-border p-6">
        <p className="text-sm">Interview question not found.</p>
        <Button type="button" render={<Link href="/interview" />}>
          Back to interview
        </Button>
      </div>
    </main>
  );
}
