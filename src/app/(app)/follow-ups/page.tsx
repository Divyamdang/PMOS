import { db } from "@/lib/db";
import { FollowUpsView } from "@/components/follow-ups/follow-ups-view";

export default async function FollowUpsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  const [followUps, people, vendors, projects] = await Promise.all([
    db.followUp.findMany({ include: { person: true, vendor: true, relatedProject: true }, orderBy: { followUpDate: "asc" } }),
    db.person.findMany({ orderBy: { name: "asc" } }),
    db.vendor.findMany({ orderBy: { name: "asc" } }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);
  return <FollowUpsView followUps={followUps} people={people} vendors={vendors} projects={projects} openNewOnLoad={params.new === "1"} />;
}
