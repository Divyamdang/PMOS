import { db } from "@/lib/db";

export async function getAllTasksForBoard() {
  const [tasks, projects] = await Promise.all([
    db.task.findMany({
      where: { parentTaskId: null },
      include: { project: true, assignee: true, subtasks: true, _count: { select: { comments: true, attachments: true } } },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
    db.project.findMany({ where: { archived: false }, select: { id: true, key: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { tasks, projects };
}
