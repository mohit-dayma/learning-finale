import Link from "next/link";
import { notFound } from "next/navigation";
import { InterviewRunner } from "@/components/interview/interview-runner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import {
  getInterviewDetail,
  getInterviewQueue,
} from "@/features/interview/queries";
import { getCurrentUser, requireUser } from "@/lib/dal";

export default async function InterviewQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}): Promise<React.JSX.Element> {
  const sessionUser = await requireUser();
  const user = await getCurrentUser();
  const { questionId } = await params;
  const [detail, queue] = await Promise.all([
    getInterviewDetail(sessionUser.id, questionId),
    getInterviewQueue(sessionUser.id, { limit: 10 }),
  ]);
  if (!detail) notFound();
  const next = queue.find((item) => item.id !== detail.id) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={user?.name ?? sessionUser.name ?? ""}
        userEmail={user?.email ?? sessionUser.email ?? ""}
      />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <Button
          type="button"
          variant="ghost"
          render={<Link href="/interview" />}
        >
          ← Interview
        </Button>
        <InterviewRunner detail={detail} nextQuestionId={next?.id ?? null} />
      </main>
    </div>
  );
}
