// Career tracker mutations (server only, "use server").
//
// Simple CRUD for job applications. Every mutation resolves the user via
// requireUser() and verifies row ownership (userId + id) before writing.

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { db } from "@/lib/db";
import type { ApplicationStatus } from "@/generated/prisma/enums";

const MAX_COMPANY_LENGTH = 200;
const MAX_ROLE_LENGTH = 200;
const MAX_URL_LENGTH = 2000;
const MAX_TEXT_LENGTH = 2000;

const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "ACCEPTED",
];

export interface CreateApplicationInput {
  company: string;
  role: string;
  jobUrl?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string | null;
  notes?: string | null;
  skillsRequired?: string | null;
  interviewNotes?: string | null;
}

export interface UpdateApplicationInput {
  id: string;
  company?: string;
  role?: string;
  jobUrl?: string | null;
  status?: ApplicationStatus;
  appliedAt?: string | null;
  notes?: string | null;
  skillsRequired?: string | null;
  interviewNotes?: string | null;
}

export interface UpdateStatusInput {
  id: string;
  status: ApplicationStatus;
}

export interface DeleteApplicationInput {
  id: string;
}

function checkId(value: string, name: string): void {
  if (!value || value.trim().length === 0) throw new Error(`${name} is required.`);
}

function checkCompany(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error("Company is required.");
  if (trimmed.length > MAX_COMPANY_LENGTH) {
    throw new Error(`Company must be under ${MAX_COMPANY_LENGTH} characters.`);
  }
  return trimmed;
}

function checkRole(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error("Role is required.");
  if (trimmed.length > MAX_ROLE_LENGTH) {
    throw new Error(`Role must be under ${MAX_ROLE_LENGTH} characters.`);
  }
  return trimmed;
}

function checkStatus(value: unknown): ApplicationStatus {
  if (
    typeof value === "string" &&
    (APPLICATION_STATUSES as readonly string[]).includes(value)
  ) {
    return value as ApplicationStatus;
  }
  throw new Error("Status is invalid.");
}

/** Optional http(s) URL. Empty / null / undefined becomes null. */
function checkJobUrl(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error(`Job URL must be under ${MAX_URL_LENGTH} characters.`);
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Job URL must be a valid http(s) URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Job URL must be a valid http(s) URL.");
  }
  return trimmed;
}

/**
 * Optional free-text field (notes / skillsRequired / interviewNotes).
 * undefined = not provided (create) / not updated (update).
 * Empty string becomes null so callers can clear a field.
 */
function checkTextField(
  value: string | null | undefined,
  fieldName: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new Error(`${fieldName} must be under ${MAX_TEXT_LENGTH} characters.`);
  }
  return trimmed;
}

/** Optional ISO date. Empty / null / undefined becomes null. */
function checkAppliedAt(value: string | null | undefined): Date | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) throw new Error("Applied date is invalid.");
  return date;
}

function revalidateCareer(): void {
  revalidatePath("/career");
  revalidatePath("/dashboard");
}

export async function createApplication(
  input: CreateApplicationInput,
): Promise<{ id: string }> {
  const user = await requireUser();
  const company = checkCompany(input.company);
  const role = checkRole(input.role);
  const jobUrl = checkJobUrl(input.jobUrl);
  const status: ApplicationStatus =
    input.status === undefined ? "WISHLIST" : checkStatus(input.status);
  const appliedAt = checkAppliedAt(input.appliedAt);
  const notes = checkTextField(input.notes, "Notes") ?? null;
  const skillsRequired = checkTextField(input.skillsRequired, "Skills required") ?? null;
  const interviewNotes = checkTextField(input.interviewNotes, "Interview notes") ?? null;

  const created = await db.careerApplication.create({
    data: {
      userId: user.id,
      company,
      role,
      jobUrl,
      status,
      appliedAt,
      notes,
      skillsRequired,
      interviewNotes,
    },
    select: { id: true },
  });

  revalidateCareer();
  return { id: created.id };
}

export async function updateApplication(
  input: UpdateApplicationInput,
): Promise<{ id: string }> {
  const user = await requireUser();
  checkId(input.id, "Application");

  const existing = await db.careerApplication.findFirst({
    where: { id: input.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Application not found.");

  const data: {
    company?: string;
    role?: string;
    jobUrl?: string | null;
    status?: ApplicationStatus;
    appliedAt?: Date | null;
    notes?: string | null;
    skillsRequired?: string | null;
    interviewNotes?: string | null;
  } = {};

  if (input.company !== undefined) data.company = checkCompany(input.company);
  if (input.role !== undefined) data.role = checkRole(input.role);
  if (input.jobUrl !== undefined) data.jobUrl = checkJobUrl(input.jobUrl);
  if (input.status !== undefined) data.status = checkStatus(input.status);
  if (input.appliedAt !== undefined) data.appliedAt = checkAppliedAt(input.appliedAt);
  const notes = checkTextField(input.notes, "Notes");
  if (notes !== undefined) data.notes = notes;
  const skillsRequired = checkTextField(input.skillsRequired, "Skills required");
  if (skillsRequired !== undefined) data.skillsRequired = skillsRequired;
  const interviewNotes = checkTextField(input.interviewNotes, "Interview notes");
  if (interviewNotes !== undefined) data.interviewNotes = interviewNotes;

  const updated = await db.careerApplication.update({
    where: { id: existing.id },
    data,
    select: { id: true },
  });

  revalidateCareer();
  return { id: updated.id };
}

export async function updateStatus(input: UpdateStatusInput): Promise<{ id: string }> {
  const user = await requireUser();
  checkId(input.id, "Application");
  const status = checkStatus(input.status);

  const existing = await db.careerApplication.findFirst({
    where: { id: input.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Application not found.");

  const updated = await db.careerApplication.update({
    where: { id: existing.id },
    data: { status },
    select: { id: true },
  });

  revalidateCareer();
  return { id: updated.id };
}

export async function deleteApplication(input: DeleteApplicationInput): Promise<void> {
  const user = await requireUser();
  checkId(input.id, "Application");

  const existing = await db.careerApplication.findFirst({
    where: { id: input.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new Error("Application not found.");

  await db.careerApplication.delete({ where: { id: existing.id } });

  revalidateCareer();
}
