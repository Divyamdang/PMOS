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

  const [planned, unplannedCandidates, followUpsToday, meetingsToday] = await Promise.all([
    db.task.findMany({
      where: { planDate: { gte: today, lte: todayEnd }, planBucket: { not: null } },
      include: { project: true },
      orderBy: { planOrder: "asc" },
    }),
    db.task.findMany({
      where: {
        planBucket: null,
        status: { not: "DONE" },
        OR: [{ dueDate: { lte: todayEnd } }, { assigneeId: user.id, isPersonal: true }],
      },
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
