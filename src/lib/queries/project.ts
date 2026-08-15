import { db } from "@/lib/db";
import { isOverdue } from "@/lib/format";

export async function getProjectByKey(key: string) {
  const project = await db.project.findUnique({
    where: { key: key.toUpperCase() },
    include: {
      owner: true,
      initiative: true,
      workstreams: true,
      vendors: { include: { vendor: true } },
    },
  });
  if (!project) return null;

  const [tasks, risks, decisions, meetings, documents, waitingFor, followUps, activity, allTasksCount, doneTasksCount] = await Promise.all([
    db.task.findMany({ where: { projectId: project.id }, include: { assignee: true, subtasks: true }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] }),
    db.risk.findMany({ where: { projectId: project.id }, include: { owner: true }, orderBy: { createdAt: "desc" } }),
    db.decision.findMany({ where: { relatedProjectId: project.id }, include: { owner: true }, orderBy: { date: "desc" } }),
    db.meeting.findMany({ where: { projectId: project.id }, include: { participants: { include: { person: true } }, actionItems: true }, orderBy: { date: "desc" } }),
    db.document.findMany({ where: { projectId: project.id }, orderBy: { updatedAt: "desc" } }),
    db.waitingForItem.findMany({ where: { projectId: project.id, status: { in: ["WAITING", "FOLLOW_UP_DUE"] } }, include: { person: true, vendor: true } }),
    db.followUp.findMany({ where: { relatedProjectId: project.id, status: { notIn: ["RESOLVED", "CLOSED"] } }, include: { person: true, vendor: true } }),
    db.activityEvent.findMany({ where: { projectId: project.id }, include: { actor: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.task.count({ where: { projectId: project.id } }),
    db.task.count({ where: { projectId: project.id, status: "DONE" } }),
  ]);

  const progress = allTasksCount > 0 ? Math.round((doneTasksCount / allTasksCount) * 100) : 0;
  const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
  const overdueTasks = tasks.filter((t) => t.status !== "DONE" && isOverdue(t.dueDate));
  const nextAction = tasks
    .filter((t) => t.status !== "DONE" && !t.isPersonal && !t.parentTaskId)
    .sort((a, b) => (a.dueDate && b.dueDate ? +new Date(a.dueDate) - +new Date(b.dueDate) : a.dueDate ? -1 : 1))[0];
  const pmWork = tasks.filter((t) => t.isPersonal);
  const projectWork = tasks.filter((t) => !t.isPersonal);

  return {
    project,
    tasks,
    projectWork,
    pmWork,
    risks,
    decisions,
    meetings,
    documents,
    waitingFor,
    followUps,
    activity,
    progress,
    taskTotal: allTasksCount,
    taskDone: doneTasksCount,
    blockedCount,
    overdueTasks,
    nextAction,
  };
}

export type ProjectCockpitData = NonNullable<Awaited<ReturnType<typeof getProjectByKey>>>;
