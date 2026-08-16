import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Resolves to the signed-in team member for this request. Every route that
 * calls this is already behind middleware.ts's auth gate, so a missing
 * session here means something is wrong with the session itself (expired
 * between middleware and handler, or a server action invoked without a
 * request context) rather than a normal "logged out" case to handle
 * gracefully — hence the throw instead of a fallback user.
 *
 * Wrapped in React's `cache()` because this is called ~23 times across 16
 * files — the (app) layout and then again inside nearly every page's query
 * function — and each call was a separate database round-trip. Against a
 * remote database that's ~900ms apiece for a value that cannot change within
 * a single request. `cache()` memoizes per request, so the first caller pays
 * and the rest are free; the returned value and the thrown errors are
 * identical either way, so no behaviour changes. */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    throw new Error("Signed-in user not found — session may be stale.");
  }
  return user;
});

/** Just the signed-in user's id, read straight off the JWT session — no
 * database round-trip. Sessions use the JWT strategy (see auth.ts), so the id
 * is already in the cookie and `auth()` only has to verify a signature.
 *
 * Exists so a page can fire its data queries *in parallel with* fetching the
 * full user row, rather than waiting on that row first purely to learn an id
 * it already had. Same id `getCurrentUser()` would return, and the same throw
 * when there's no session. */
export const getCurrentUserId = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not signed in.");
  }
  return session.user.id;
});
