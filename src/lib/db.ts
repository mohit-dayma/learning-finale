import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error(
      'Missing required environment variable "DATABASE_URL". Copy ".env.example" to ".env" and set it to your Postgres connection string.',
    );
  }
  // Plain `pg` pool works with local Postgres and with Neon
  // (direct or pooled). The Neon serverless driver only works
  // with Neon endpoints, so it cannot be the default here.
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Reuse the client across hot reloads in development to avoid
// exhausting the database connection pool.
export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = db;
}
