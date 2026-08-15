import { db } from "@/lib/db";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ capture?: string }> }) {
  const params = await searchParams;
  const [items, projects] = await Promise.all([
    db.inboxItem.findMany({ where: { converted: false }, orderBy: { createdAt: "desc" } }),
    db.project.findMany({ where: { archived: false }, select: { id: true, key: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return <InboxView items={items} projects={projects} openCaptureOnLoad={params.capture === "1"} />;
}
