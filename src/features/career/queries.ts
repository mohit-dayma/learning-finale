// Career tracker data layer (server only).
//
// Simple job-application list (not a CRM). Pages call getApplications()
// and getCareerStats() and pass plain DTOs to client components. Every
// query filters by userId (authorization).

import { db } from "@/lib/db";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export interface CareerItem {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  jobUrl: string | null;
  notes: string | null;
  skillsRequired: string | null;
  interviewNotes: string | null;
  appliedAt: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CareerStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  interviewing: number;
  offers: number;
}

const EMPTY_BY_STATUS: Record<ApplicationStatus, number> = {
  WISHLIST: 0,
  APPLIED: 0,
  SCREENING: 0,
  INTERVIEW: 0,
  OFFER: 0,
  REJECTED: 0,
  ACCEPTED: 0,
};

/**
 * List one user's applications, newest activity first.
 * Always filters by userId (authorization); optional status filter
 * narrows further.
 */
export async function getApplications(
  userId: string,
  statusFilter?: ApplicationStatus,
): Promise<CareerItem[]> {
  const rows = await db.careerApplication.findMany({
    where: statusFilter
      ? { userId, status: statusFilter }
      : { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      company: true,
      role: true,
      status: true,
      jobUrl: true,
      notes: true,
      skillsRequired: true,
      interviewNotes: true,
      appliedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status,
    jobUrl: row.jobUrl,
    notes: row.notes,
    skillsRequired: row.skillsRequired,
    interviewNotes: row.interviewNotes,
    appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/** Counts for the stats summary line, via a single groupBy. */
export async function getCareerStats(userId: string): Promise<CareerStats> {
  const groups = await db.careerApplication.groupBy({
    by: ["status"],
    where: { userId },
    _count: { status: true },
  });

  const byStatus: Record<ApplicationStatus, number> = { ...EMPTY_BY_STATUS };
  for (const group of groups) {
    byStatus[group.status] = group._count.status;
  }

  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

  return {
    total,
    byStatus,
    interviewing: byStatus.INTERVIEW,
    offers: byStatus.OFFER,
  };
}
