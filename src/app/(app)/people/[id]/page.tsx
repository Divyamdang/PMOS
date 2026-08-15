import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PersonProfile } from "@/components/people/person-profile";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await db.person.findUnique({
    where: { id },
    include: {
      interactions: { orderBy: { date: "desc" } },
      tasks: { where: { status: { not: "DONE" } }, include: { project: true }, orderBy: { priority: "asc" } },
      followUps: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } } },
    },
  });
  if (!person) notFound();
  return <PersonProfile person={person} />;
}
