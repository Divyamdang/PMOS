import { db } from "@/lib/db";
import { DecisionsView } from "@/components/decisions/decisions-view";

export default async function DecisionsPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  const [decisions, projects] = await Promise.all([
    db.decision.findMany({ include: { owner: true, relatedProject: true }, orderBy: { date: "desc" } }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);
  return <DecisionsView decisions={decisions} projects={projects} openNewOnLoad={params.new === "1"} />;
}
