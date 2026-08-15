import { google } from "googleapis";
import { getGoogleClient } from "./client";

export type GmailMessage = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string | null;
};

function headerValue(headers: { name?: string | null; value?: string | null }[] | undefined, name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

/** Recent unread inbox messages — deliberately just a read, no scope beyond
 * gmail.readonly, and nothing here writes to Gmail. */
export async function listRecentGmailMessages(userId: string, maxResults = 15): Promise<GmailMessage[]> {
  const auth = await getGoogleClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "in:inbox is:unread",
  });

  const ids = list.data.messages ?? [];
  const messages = await Promise.all(
    ids.map(async (m) => {
      const detail = await gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: ["Subject", "From", "Date"] });
      const headers = detail.data.payload?.headers;
      return {
        id: m.id!,
        subject: headerValue(headers, "Subject") || "(no subject)",
        from: headerValue(headers, "From"),
        snippet: detail.data.snippet ?? "",
        receivedAt: headerValue(headers, "Date") || null,
      };
    })
  );

  return messages;
}
