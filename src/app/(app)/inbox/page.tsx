import { db } from "@/lib/db";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ capture?: string }> }) {
  const params = await searchParams;
  const items = await db.inboxItem.findMany({ where: { converted: false }, orderBy: { createdAt: "desc" } });
  return <InboxView items={items} openCaptureOnLoad={params.capture === "1"} />;
}
