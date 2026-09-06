import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskRunner } from "@/components/tasks/task-runner";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { getTaskData } from "@/features/tasks/queries";
import { getCurrentUser, requireUser } from "@/lib/dal";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}): Promise<React.JSX.Element> {
  const sessionUser = await requireUser();
  const user = await getCurrentUser();
  const { questionId } = await params;
  const task = await getTaskData(sessionUser.id, questionId);
  if (!task) notFound();

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
        <TaskRunner task={task} />
      </main>
    </div>
  );
}
