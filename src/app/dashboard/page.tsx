import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { ReviewsCard } from "@/components/dashboard/reviews-card";
import { WeakAreasCard } from "@/components/dashboard/weak-areas-card";
import { RecentMistakesCard } from "@/components/dashboard/recent-mistakes-card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/features/dashboard/queries";
import { getCurrentUser, requireUser } from "@/lib/dal";

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const user = await requireUser();
  const profile = await getCurrentUser();
  const displayName = profile?.name ?? user.name ?? user.email;
  const data = await getDashboardData(user.id, displayName);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={displayName} userEmail={profile?.email ?? user.email} />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        {data.focus ? (
          <TodayFocusCard focus={data.focus} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s focus</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recommendation yet. Answer questions to get a focus topic.
              </p>
            </CardContent>
          </Card>
        )}
        <ReviewsCard reviews={data.reviews} />
        <WeakAreasCard areas={data.weakAreas} />
        <RecentMistakesCard mistakes={data.mistakes} />
        <ProgressCard progress={data.progress} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Interview mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Practice weighted by weak areas, interview importance, recent
                mistakes, and mastery — answers stay hidden until you submit.
              </p>
              <Button type="button" render={<Link href="/interview" />}>
                Start interview practice
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Career tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                A simple list of applications: company, role, status, and
                interview notes.
              </p>
              <Button
                type="button"
                variant="outline"
                render={<Link href="/career" />}
              >
                Open career tracker
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
