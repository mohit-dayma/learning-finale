"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

function validate(name: string, email: string, password: string): string | null {
  if (name.trim().length < 2) {
    return "Name must be at least 2 characters long.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  return null;
}

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already exists") || lower.includes("duplicate")) {
    return "An account with this email already exists. Try to log in.";
  }
  return message;
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const validationError = validate(name, email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    const { error: signUpError } = await authClient.signUp.email(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => {
          router.push("/dashboard");
          router.refresh();
        },
      },
    );
    setPending(false);
    if (signUpError) {
      setError(friendlyError(signUpError.message ?? "Sign up failed."));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          className="h-9 rounded-lg border border-input bg-background px-2.5"
        />
      </label>
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="h-9 rounded-lg border border-input bg-background px-2.5"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Sign up"}
      </Button>
    </form>
  );
}
