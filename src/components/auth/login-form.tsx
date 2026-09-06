"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid") && lower.includes("credential")) {
    return "Invalid email or password.";
  }
  if (lower.includes("not found") || lower.includes("no user")) {
    return "Invalid email or password.";
  }
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length === 0) {
      setError("Enter your password.");
      return;
    }

    setPending(true);
    const { error: signInError } = await authClient.signIn.email(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
      },
    );
    setPending(false);
    if (signInError) {
      setError(friendlyError(signInError.message ?? "Login failed."));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-9 rounded-lg border border-input bg-background px-2.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          className="h-9 rounded-lg border border-input bg-background px-2.5"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
