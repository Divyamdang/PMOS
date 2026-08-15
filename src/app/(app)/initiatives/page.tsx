import { db } from "@/lib/db";
import { InitiativesView } from "@/components/initiatives/initiatives-view";

export default async function InitiativesPage() {
  const initiatives = await db.initiative.findMany({
    include: { owner: true, projects: { include: { _count: { select: { tasks: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return <InitiativesView initiatives={initiatives} />;
}
