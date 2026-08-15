import { db } from "@/lib/db";
import { ReleasesView } from "@/components/releases/releases-view";

export default async function ReleasesPage() {
  const [releases, projects] = await Promise.all([
    db.release.findMany({ include: { projects: { include: { project: true } } }, orderBy: { targetDate: "asc" } }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);

  const withStats = await Promise.all(
    releases.map(async (r) => {
      const projectIds = r.projects.map((p) => p.projectId);
      const [total, done, blockers] = await Promise.all([
        db.task.count({ where: { projectId: { in: projectIds } } }),
        db.task.count({ where: { projectId: { in: projectIds }, status: "DONE" } }),
        db.task.count({ where: { projectId: { in: projectIds }, status: "BLOCKED" } }),
      ]);
      return { ...r, completion: total > 0 ? Math.round((done / total) * 100) : 0, openIssues: total - done, blockers };
    })
  );

  return <ReleasesView releases={withStats} projects={projects} />;
}
