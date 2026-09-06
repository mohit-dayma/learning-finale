import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSession } from "@/lib/dal";

const STACK_CHECKS = [
  { name: "Next.js", status: "ok" },
  { name: "Tailwind CSS", status: "ok" },
  { name: "shadcn/ui", status: "ok" },
  { name: "TypeScript", status: "ok" },
  { name: "Better Auth", status: "ok" },
] as const;

export default async function Home(): Promise<React.JSX.Element> {
  const session = await getSession();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Learning System</CardTitle>
          <CardDescription>
            {session?.user
              ? `Signed in as ${session.user.name} (${session.user.email}).`
              : "Foundation check — every item below proves one part of the stack renders."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {STACK_CHECKS.map((check) => (
              <li key={check.name}>
                <Badge variant="secondary">
                  {check.name}: {check.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {session?.user ? (
            <>
              <Button type="button" render={<Link href="/dashboard" />}>
                Open dashboard
              </Button>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button type="button" render={<Link href="/signup" />}>
                Sign up
              </Button>
              <Button type="button" variant="outline" render={<Link href="/login" />}>
                Log in
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
