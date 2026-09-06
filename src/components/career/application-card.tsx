"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteApplication,
  updateApplication,
  updateStatus,
} from "@/features/career/actions";
import type { CareerItem } from "@/features/career/queries";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { StatusBadge } from "./status-badge";

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

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function ApplicationCard({
  item,
  onChanged,
}: {
  item: CareerItem;
  onChanged?: () => void;
}): React.JSX.Element {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState(item.company);
  const [role, setRole] = useState(item.role);
  const [jobUrl, setJobUrl] = useState(item.jobUrl ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(item.status);
  const [appliedAt, setAppliedAt] = useState(toDateInputValue(item.appliedAt));
  const [notes, setNotes] = useState(item.notes ?? "");
  const [skillsRequired, setSkillsRequired] = useState(item.skillsRequired ?? "");
  const [interviewNotes, setInterviewNotes] = useState(item.interviewNotes ?? "");

  function refresh(): void {
    router.refresh();
    onChanged?.();
  }

  async function handleQuickStatus(next: ApplicationStatus) {
    if (next === item.status || pending) return;
    setError(null);
    setPending(true);
    try {
      await updateStatus({ id: item.id, status: next });
      setStatus(next);
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await updateApplication({
        id: item.id,
        company,
        role,
        jobUrl,
        status,
        appliedAt,
        notes,
        skillsRequired,
        interviewNotes,
      });
      setEditing(false);
      refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${item.company} — ${item.role}?`)) return;
    setError(null);
    setPending(true);
    try {
      await deleteApplication({ id: item.id });
      refresh();
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  }

  function cancelEdit(): void {
    setCompany(item.company);
    setRole(item.role);
    setJobUrl(item.jobUrl ?? "");
    setStatus(item.status);
    setAppliedAt(toDateInputValue(item.appliedAt));
    setNotes(item.notes ?? "");
    setSkillsRequired(item.skillsRequired ?? "");
    setInterviewNotes(item.interviewNotes ?? "");
    setError(null);
    setEditing(false);
  }

  const appliedLabel = formatDate(item.appliedAt);
  const inputClass =
    "w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>
              {item.company} — {item.role}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {appliedLabel ? `Applied ${appliedLabel}` : "Not applied yet"}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.jobUrl ? (
          <p className="truncate text-sm">
            <a
              href={item.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {item.jobUrl}
            </a>
          </p>
        ) : null}

        {item.skillsRequired ? (
          <div className="text-sm">
            <p className="font-medium">Skills required</p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {item.skillsRequired}
            </p>
          </div>
        ) : null}

        {item.notes ? (
          <div className="text-sm">
            <p className="font-medium">Notes</p>
            <p className="whitespace-pre-wrap text-muted-foreground">{item.notes}</p>
          </div>
        ) : null}

        {item.interviewNotes ? (
          <div className="text-sm">
            <p className="font-medium">Interview notes</p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {item.interviewNotes}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status</span>
            <select
              className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              value={item.status}
              disabled={pending}
              onChange={(e) => handleQuickStatus(e.target.value as ApplicationStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => (editing ? cancelEdit() : setEditing(true))}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>

        {editing ? (
          <form className="space-y-3 border-t pt-3" onSubmit={handleSave}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Company *</span>
                <input
                  className={inputClass}
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
                  required
                  maxLength={200}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Job URL</span>
                <input
                  className={inputClass}
                  placeholder="https://… (empty clears)"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
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
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Notes</span>
              <textarea
                className="min-h-16 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Interview notes</span>
              <textarea
                className="min-h-16 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm"
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
              />
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
