import { google } from "googleapis";
import { db } from "@/lib/db";

/** Auth.js's Prisma adapter persists the Google OAuth tokens on the Account
 * row it creates at sign-in (see src/auth.ts — access_type: "offline" +
 * prompt: "consent" is what makes a refresh_token show up there at all).
 * This builds an authenticated googleapis client from those tokens, and
 * writes back the refreshed access_token when Google rotates it so the
 * next call doesn't have to re-refresh. */
export async function getGoogleClient(userId: string) {
  const account = await db.account.findFirst({ where: { userId, provider: "google" } });
  if (!account?.refresh_token && !account?.access_token) {
    throw new Error("Google account not connected. Sign in again to grant Gmail/Calendar access.");
  }

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    await db.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        refresh_token: tokens.refresh_token ?? undefined,
      },
    });
  });

  return oauth2Client;
}
