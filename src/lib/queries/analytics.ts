import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { subDays } from "date-fns";

export async function getAnalyticsData() {
  const user = await getCurrentUser();
  const since = subDays(new Date(), 30);

  const [createdCount, completedTasks, overdueCount, totalActive, blockedCount, followUpsCompleted, projects] = await Promise.all([
    db.task.count({ where: { createdAt: { gte: since } } }),
    db.task.findMany({ where: { completedAt: { gte: since } }, select: { createdAt: true, completedAt: true } }),
    db.task.count({ where: { status: { not: "DONE" }, dueDate: { lt: new Date() } } }),
    db.task.count({ where: { status: { not: "DONE" } } }),
    db.task.count({ where: { status: "BLOCKED" } }),
    db.followUp.count({ where: { status: "RESOLVED", updatedAt: { gte: since } } }),
    db.project.findMany({
      where: { archived: false },
      include: { _count: { select: { tasks: true, risks: true } } },
    }),
  ]);

  const cycleTimes = completedTasks
    .filter((t) => t.completedAt)
    .map((t) => (+new Date(t.completedAt!) - +new Date(t.createdAt)) / (1000 * 60 * 60 * 24));
  const avgCycleTime = cycleTimes.length > 0 ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length : 0;
  const completionRate = totalActive + completedTasks.length > 0 ? Math.round((completedTasks.length / (totalActive + completedTasks.length)) * 100) : 0;
  const overdueRate = totalActive > 0 ? Math.round((overdueCount / totalActive) * 100) : 0;

  const projectStats = await Promise.all(
    projects.map(async (p) => {
      const done = await db.task.count({ where: { projectId: p.id, status: "DONE" } });
      const blocked = await db.task.count({ where: { projectId: p.id, status: "BLOCKED" } });
      return {
        id: p.id,
        key: p.key,
        name: p.name,
        health: p.health,
        progress: p._count.tasks > 0 ? Math.round((done / p._count.tasks) * 100) : 0,
        taskTotal: p._count.tasks,
        blocked,
        risks: p._count.risks,
      };
    })
  );

  return {
    user,
    createdCount,
    completedCount: completedTasks.length,
    completionRate,
    overdueRate,
    avgCycleTime: Math.round(avgCycleTime * 10) / 10,
    blockedCount,
    followUpsCompleted,
    projectStats,
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalyticsData>>;
