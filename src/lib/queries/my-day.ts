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

export async function getMyDayData() {
  const user = await getCurrentUser();
  const today = startOfToday();
  const todayEnd = endOfToday();

  // My Day is the PM's own day: work they personally own, whether or not it
  // references a project. Project delivery tasks (features, bugs, tech debt)
  // stay on the project board and out of here — there are far more of them
  // than there are hours, and they'd bury the handful of things that actually
  // need the PM today.
  //
  // `isPersonal` carries that distinction (defaulted from task type, see
  // lib/tasks/create-data.ts, overridable per task). The assignee filter is
  // just as important: without it this listed every teammate's work too.
  const ownWork = { assigneeId: user.id, isPersonal: true };

  const [planned, unplannedCandidates, followUpsToday, meetingsToday] = await Promise.all([
    db.task.findMany({
      where: { ...ownWork, planDate: { gte: today, lte: todayEnd }, planBucket: { not: null } },
      include: { project: true },
      orderBy: { planOrder: "asc" },
    }),
    db.task.findMany({
      where: { ...ownWork, planBucket: null, status: { not: "DONE" } },
      include: { project: true },
      orderBy: [{ priority: "asc" }],
      take: 15,
    }),
    db.followUp.findMany({
      where: { followUpDate: { lte: todayEnd }, status: { in: ["TO_CONTACT", "FOLLOW_UP_DUE", "WAITING_FOR_RESPONSE"] } },
      include: { person: true, vendor: true },
    }),
    db.meeting.findMany({ where: { date: { gte: today, lte: todayEnd } }, include: { project: true }, orderBy: { date: "asc" } }),
  ]);

  return { planned, unplannedCandidates, followUpsToday, meetingsToday };
}

export type MyDayData = Awaited<ReturnType<typeof getMyDayData>>;
