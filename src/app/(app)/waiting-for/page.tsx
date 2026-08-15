import { db } from "@/lib/db";
import { WaitingForView } from "@/components/waiting-for/waiting-for-view";

export default async function WaitingForPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  const [items, people, vendors, projects] = await Promise.all([
    db.waitingForItem.findMany({ include: { person: true, vendor: true, project: true }, orderBy: { followUpDate: "asc" } }),
    db.person.findMany({ orderBy: { name: "asc" } }),
    db.vendor.findMany({ orderBy: { name: "asc" } }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);
  return <WaitingForView items={items} people={people} vendors={vendors} projects={projects} openNewOnLoad={params.new === "1"} />;
}
