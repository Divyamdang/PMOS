import { db } from "@/lib/db";

const OWNER_EMAIL = "divyamdang02@gmail.com";

/** Single-user app — this is always the PM using PMOS. */
export async function getCurrentUser() {
  const user = await db.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (user) return user;
  const fallback = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!fallback) throw new Error("No users found — run `npm run db:seed`.");
  return fallback;
}
