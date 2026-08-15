import { google } from "googleapis";
import { getGoogleClient } from "./client";

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  start: string | null;
  description: string | null;
};

export async function listUpcomingGoogleEvents(userId: string, maxResults = 15): Promise<GoogleCalendarEvent[]> {
  const auth = await getGoogleClient(userId);
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (res.data.items ?? [])
    .filter((e) => e.id && e.status !== "cancelled")
    .map((e) => ({
      id: e.id!,
      title: e.summary ?? "(untitled event)",
      start: e.start?.dateTime ?? e.start?.date ?? null,
      description: e.description ?? null,
    }));
}
