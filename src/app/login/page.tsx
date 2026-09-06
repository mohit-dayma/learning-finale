import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/dal";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Use your email and password.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LoginForm />
          <p className="text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
