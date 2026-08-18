import { db } from "@/lib/db";
import { getCurrentUser, getCurrentUserId } from "@/lib/current-user";

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

/** Everything the dashboard renders, in a single parallel wave.
 *
 * This used to run as four sequential waves — resolve the user, then the main
 * query batch, then a per-project progress loop, then My Day — and each wave
 * paid a full database round-trip before the next could start (~4.5s total
 * against a remote database, for a page with almost no data on it).
 *
 * Three things collapse it to one wave: the user id comes off the JWT so the
 * queries don't have to wait for the user row; My Day never depended on the
 * batch above it; and per-project progress is one grouped aggregate instead
 * of two counts per project. Same returned shape, same numbers. */
export async function getDashboardData() {
  const userId = await getCurrentUserId();
  const today = startOfToday();
  const todayEnd = endOfToday();

  const [user, overdueTasks, dueTodayTasks, blockedTasks, followUpsDue, waitingDue, activeTasks, projects, upcomingMeetings, doneByProject, myDayTasks] =
    await Promise.all([
      getCurrentUser(),
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
          OR: [{ dueDate: { lte: todayEnd } }, { assigneeId: userId, status: { in: ["IN_PROGRESS", "WAITING", "BLOCKED"] } }],
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
      // Done-task counts for every project in one aggregate. Replaces a loop
      // that ran two counts per project — the totals already come back on
      // each project as `_count.tasks`, so only the done side is missing.
      db.task.groupBy({ by: ["projectId"], where: { status: "DONE" }, _count: { _all: true } }),
      // Mirrors /my-day: the PM's own work only. This previously also pulled
      // in any task assigned to them that was due today, which meant project
      // delivery work leaked into the day view. See lib/queries/my-day.ts.
      db.task.findMany({
        where: { assigneeId: userId, isPersonal: true, status: { notIn: ["DONE"] } },
        orderBy: [{ priority: "asc" }],
        take: 8,
        include: { project: true },
      }),
    ]);

  const doneCounts = new Map(doneByProject.map((g) => [g.projectId, g._count._all]));
  const projectsWithProgress = projects.map((p) => {
    const total = p._count.tasks;
    const done = doneCounts.get(p.id) ?? 0;
    return { ...p, progress: total > 0 ? Math.round((done / total) * 100) : 0, taskTotal: total };
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
