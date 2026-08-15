import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { fetchGmailMessages } from "@/app/actions/gmail";
import { InboxView } from "@/components/inbox/inbox-view";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ capture?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const [items, projects, gmail] = await Promise.all([
    db.inboxItem.findMany({ where: { converted: false, userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.project.findMany({ where: { archived: false }, select: { id: true, key: true, name: true }, orderBy: { name: "asc" } }),
    fetchGmailMessages(),
  ]);
  return <InboxView items={items} projects={projects} gmail={gmail} openCaptureOnLoad={params.capture === "1"} />;
}
