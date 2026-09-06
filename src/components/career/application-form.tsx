"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createApplication } from "@/features/career/actions";
import type { ApplicationStatus } from "@/generated/prisma/enums";

const STATUSES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ACCEPTED",
];

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return "Something went wrong. Try again.";
}

export function ApplicationForm({
  onCreated,
}: {
  onCreated?: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("WISHLIST");
  const [appliedAt, setAppliedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createApplication({
        company,
        role,
        jobUrl: jobUrl.trim().length === 0 ? null : jobUrl,
        status,
        appliedAt: appliedAt.trim().length === 0 ? null : appliedAt,
        notes: notes.trim().length === 0 ? null : notes,
        skillsRequired: skillsRequired.trim().length === 0 ? null : skillsRequired,
        interviewNotes: interviewNotes.trim().length === 0 ? null : interviewNotes,
      });
      setCompany("");
      setRole("");
      setJobUrl("");
      setStatus("WISHLIST");
      setAppliedAt("");
      setNotes("");
      setSkillsRequired("");
      setInterviewNotes("");
      router.refresh();
      onCreated?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add application</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Company *</span>
              <input
                className={inputClass}
                placeholder="Acme Inc"
                required
                maxLength={200}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Role *</span>
              <input
                className={inputClass}
                placeholder="Frontend Engineer"
                required
                maxLength={200}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Job URL</span>
              <input
                className={inputClass}
                placeholder="https://…"
                inputMode="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <select
                  className={inputClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Date applied</span>
                <input
                  type="date"
                  className={inputClass}
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                />
              </label>
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Skills required</span>
            <textarea
              className="min-h-16 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
              placeholder="React, TypeScript, …"
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Notes</span>
            <textarea
              className="min-h-16 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
              placeholder="Referral, salary range, …"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Interview notes</span>
            <textarea
              className="min-h-16 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
              placeholder="Rounds, questions asked, …"
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
