import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  const today = startOfToday();
  const todayEnd = endOfToday();

  const [overdueTasks, dueTodayTasks, blockedTasks, followUpsDue, waitingDue, activeTasks, projects, upcomingMeetings] =
    await Promise.all([
      db.task.count({ where: { dueDate: { lt: today }, status: { not: "DONE" } } }),
      db.task.count({ where: { dueDate: { gte: today, lte: todayEnd }, status: { not: "DONE" } } }),
      db.task.count({ where: { status: "BLOCKED" } }),
      db.followUp.findMany({
        where: { followUpDate: { lte: todayEnd }, status: { in: ["TO_CONTACT", "FOLLOW_UP_DUE", "WAITING_FOR_RESPONSE"] } },
        include: { person: true, vendor: true },
        orderBy: { followUpDate: "asc" },
        take: 5,
      }),
      db.waitingForItem.findMany({
        where: { followUpDate: { lte: todayEnd }, status: "WAITING" },
        include: { person: true, vendor: true, project: true },
        orderBy: { followUpDate: "asc" },
        take: 5,
      }),
      db.task.findMany({
        where: {
          status: { notIn: ["DONE"] },
          OR: [{ dueDate: { lte: todayEnd } }, { assigneeId: user.id, status: { in: ["IN_PROGRESS", "WAITING", "BLOCKED"] } }],
        },
        include: { project: true },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        take: 24,
      }),
      db.project.findMany({
        where: { archived: false, status: { not: "COMPLETED" } },
        include: { _count: { select: { tasks: true } } },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      db.meeting.findMany({ where: { date: { gte: today } }, orderBy: { date: "asc" }, take: 4, include: { project: true } }),
    ]);

  const projectsWithProgress = await Promise.all(
    projects.map(async (p) => {
      const [total, done] = await Promise.all([
        db.task.count({ where: { projectId: p.id } }),
        db.task.count({ where: { projectId: p.id, status: "DONE" } }),
      ]);
      return { ...p, progress: total > 0 ? Math.round((done / total) * 100) : 0, taskTotal: total };
    })
  );

  const myDayTasks = await db.task.findMany({
    where: {
      OR: [
        { assigneeId: user.id, dueDate: { gte: today, lte: todayEnd } },
        { assigneeId: user.id, isPersonal: true, status: { notIn: ["DONE"] } },
      ],
    },
    orderBy: [{ priority: "asc" }],
    take: 8,
    include: { project: true },
  });
  const myDayDone = myDayTasks.filter((t) => t.status === "DONE").length;

  return {
    user,
    attention: { overdue: overdueTasks, dueToday: dueTodayTasks, blocked: blockedTasks, followUpsDue: followUpsDue.length, waitingDue: waitingDue.length },
    followUpsDue,
    waitingDue,
    activeTasks,
    projects: projectsWithProgress,
    upcomingMeetings,
    myDayTasks,
    myDayDone,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
