import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser, requireUser } from "@/lib/dal";
import { db } from "@/lib/db";

// Protected area. proxy.ts redirects guests (optimistic check).
// requireUser() runs the secure check here (authorization).
export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser();

  // Authorization: every query filters by the session user id.
  // A user can read only rows that carry their own id.
  const [sessionCount, planCount, mistakeCount] = await Promise.all([
    db.learningSession.count({ where: { userId: sessionUser.id } }),
    db.studyPlan.count({ where: { userId: sessionUser.id } }),
    db.mistake.count({ where: { userId: sessionUser.id, isResolved: false } }),
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Signed in as {user?.name ?? sessionUser.name} ({user?.email ?? sessionUser.email})
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="text-sm">
            <li>Learning sessions (yours): {sessionCount}</li>
            <li>Study plans (yours): {planCount}</li>
            <li>Open mistakes (yours): {mistakeCount}</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Auth proves who you are. Each count above filters by your id, so you see only your
            data. That filter is authorization.
          </p>
          <LogoutButton />
        </CardContent>
      </Card>
    </main>
  );
}
