import type { NextAuthConfig } from "next-auth";

/** The Edge-safe half of the auth config — no Prisma adapter, no provider
 * that touches Node-only APIs. middleware.ts runs in the Edge runtime and
 * can only import this file; the database-backed half lives in auth.ts,
 * which is only ever imported from Node.js runtime code (Server
 * Components, Route Handlers, Server Actions). Splitting it this way is
 * the documented Auth.js pattern for Prisma + Edge middleware — importing
 * the Prisma adapter directly into middleware fails the build because
 * Prisma's engine uses Node APIs (setImmediate, etc.) the Edge runtime
 * doesn't have. Session strategy is JWT (not "database") for the same
 * reason: verifying a JWT cookie signature needs no database round trip,
 * so middleware can check auth state without ever touching Prisma.
 */
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },
  providers: [],
} satisfies NextAuthConfig;
