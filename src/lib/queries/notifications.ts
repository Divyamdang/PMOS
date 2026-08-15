import { db } from "@/lib/db";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Computed live from current state, not a persisted log — so it's
 * inherently non-spammy (no unbounded growth, always reflects "right now"). */
export async function getNotifications() {
  const today = startOfToday();
  const in2Hours = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const [overdueTasks, blockedTasks, followUpsDue, upcomingMeetings, risksDue] = await Promise.all([
    db.task.findMany({ where: { status: { not: "DONE" }, dueDate: { lt: today } }, select: { id: true, taskKey: true, title: true }, take: 5 }),
    db.task.findMany({ where: { status: "BLOCKED" }, select: { id: true, taskKey: true, title: true }, take: 5 }),
    db.followUp.findMany({ where: { followUpDate: { lte: today }, status: { in: ["TO_CONTACT", "FOLLOW_UP_DUE", "WAITING_FOR_RESPONSE"] } }, select: { id: true, topic: true }, take: 5 }),
    db.meeting.findMany({ where: { date: { gte: new Date(), lte: in2Hours } }, select: { id: true, title: true, date: true }, take: 5 }),
    db.risk.findMany({ where: { status: { in: ["MONITORING", "ESCALATED"] }, dueDate: { lte: today } }, select: { id: true, risk: true }, take: 5 }),
  ]);

  return { overdueTasks, blockedTasks, followUpsDue, upcomingMeetings, risksDue };
}

export type NotificationsData = Awaited<ReturnType<typeof getNotifications>>;
