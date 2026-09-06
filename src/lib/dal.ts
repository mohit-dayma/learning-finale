import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";

// Authentication: who is the user? Read the server session.
// Authorization: what can the user access? Enforced by filtering
// every query with the session user id (see dashboard page).
export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      image: true,
      createdAt: true,
    },
  });
  return user;
});
