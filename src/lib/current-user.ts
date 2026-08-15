import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Resolves to the signed-in team member for this request. Every route that
 * calls this is already behind middleware.ts's auth gate, so a missing
 * session here means something is wrong with the session itself (expired
 * between middleware and handler, or a server action invoked without a
 * request context) rather than a normal "logged out" case to handle
 * gracefully — hence the throw instead of a fallback user. */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    throw new Error("Signed-in user not found — session may be stale.");
  }
  return user;
}
