import { db } from "@/lib/db";
import { PeopleView } from "@/components/people/people-view";

export default async function PeoplePage() {
  const people = await db.person.findMany({
    include: { _count: { select: { tasks: true, followUps: true } } },
    orderBy: { name: "asc" },
  });
  return <PeopleView people={people} />;
}
