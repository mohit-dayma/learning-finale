import { AppHeader } from "@/components/layout/app-header";
import { CareerTracker } from "@/components/career/career-tracker";
import { getApplications, getCareerStats } from "@/features/career/queries";
import { getCurrentUser, requireUser } from "@/lib/dal";

export default async function CareerPage(): Promise<React.JSX.Element> {
  const user = await requireUser();
  const profile = await getCurrentUser();
  const displayName = profile?.name ?? user.name ?? user.email;

  const [applications, stats] = await Promise.all([
    getApplications(user.id),
    getCareerStats(user.id),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={displayName} userEmail={profile?.email ?? user.email} />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Career tracker</h1>
          <p className="text-sm text-muted-foreground">
            A simple list of where you have applied and what is next.
          </p>
        </div>
        <CareerTracker initialItems={applications} stats={stats} />
      </main>
    </div>
  );
}
