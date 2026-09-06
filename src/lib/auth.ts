import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

// Better Auth server instance. Runs only on the server.
// Sessions live in Postgres (Session table). The browser holds
// only an httpOnly cookie. No secret ever reaches the client.
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
