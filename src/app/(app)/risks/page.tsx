import { db } from "@/lib/db";
import { RisksView } from "@/components/risks/risks-view";

export default async function RisksPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const params = await searchParams;
  const [risks, projects] = await Promise.all([
    db.risk.findMany({ include: { owner: true, project: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);
  return <RisksView risks={risks} projects={projects} openNewOnLoad={params.new === "1"} />;
}
