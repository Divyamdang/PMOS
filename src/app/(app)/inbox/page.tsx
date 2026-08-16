import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { fetchGmailMessages } from "@/app/actions/gmail";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ capture?: string }> }) {
  const params = await searchParams;
  const userId = await getCurrentUserId();

  // Deliberately not awaited. Gmail is a live third-party call, and awaiting it
  // here alongside the local queries held the entire page back by ~4.5s before
  // anything rendered. Handing the promise to the client lets the captured
  // items paint immediately while the Gmail section streams in behind its own
  // Suspense boundary. Same data ends up on screen either way.
  const gmailPromise = fetchGmailMessages();

  const [items, projects] = await Promise.all([
    db.inboxItem.findMany({ where: { converted: false, userId }, orderBy: { createdAt: "desc" } }),
    db.project.findMany({ where: { archived: false }, select: { id: true, key: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return <InboxView items={items} projects={projects} gmailPromise={gmailPromise} openCaptureOnLoad={params.capture === "1"} />;
}
