import { db } from "@/lib/db";
import { ProjectsView } from "@/components/projects/projects-view";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const params = await searchParams;
  const projects = await db.project.findMany({
    where: { archived: false },
    include: { owner: true, _count: { select: { tasks: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const withProgress = await Promise.all(
    projects.map(async (p) => {
      const [total, done] = await Promise.all([
        db.task.count({ where: { projectId: p.id } }),
        db.task.count({ where: { projectId: p.id, status: "DONE" } }),
      ]);
      return { ...p, progress: total > 0 ? Math.round((done / total) * 100) : 0, taskTotal: total };
    })
  );

  return <ProjectsView projects={withProgress} openNewOnLoad={params.new === "1"} />;
}
