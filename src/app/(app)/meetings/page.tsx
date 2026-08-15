import { db } from "@/lib/db";
import { MeetingsView } from "@/components/meetings/meetings-view";

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  const [meetings, people, projects] = await Promise.all([
    db.meeting.findMany({
      include: { participants: { include: { person: true } }, actionItems: true, project: true },
      orderBy: { date: "desc" },
    }),
    db.person.findMany({ orderBy: { name: "asc" } }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);
  return <MeetingsView meetings={meetings} people={people} projects={projects} openNewOnLoad={params.new === "1"} />;
}
