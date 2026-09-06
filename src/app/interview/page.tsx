import Link from "next/link";
import { InterviewStarter } from "@/components/interview/interview-starter";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import {
  getInterviewFilters,
  getInterviewQueue,
  getInterviewStats,
} from "@/features/interview/queries";
import { getCurrentUser, requireUser } from "@/lib/dal";

export default async function InterviewPage(): Promise<React.JSX.Element> {
  const sessionUser = await requireUser();
  const user = await getCurrentUser();
  const [filters, queue, stats] = await Promise.all([
    getInterviewFilters(),
    getInterviewQueue(sessionUser.id, { limit: 10 }),
    getInterviewStats(sessionUser.id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        userName={user?.name ?? sessionUser.name ?? ""}
        userEmail={user?.email ?? sessionUser.email ?? ""}
      />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <Button type="button" variant="ghost" render={<Link href="/dashboard" />}>
          ← Dashboard
        </Button>
        <InterviewStarter filters={filters} queue={queue} stats={stats} />
      </main>
    </div>
  );
}
