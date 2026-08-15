import { db } from "@/lib/db";
import { startOfMonth, endOfMonth, addDays, subDays } from "date-fns";

export async function getCalendarData(monthDate: Date) {
  const rangeStart = subDays(startOfMonth(monthDate), 7);
  const rangeEnd = addDays(endOfMonth(monthDate), 7);

  const [tasks, followUps, meetings] = await Promise.all([
    db.task.findMany({
      where: { dueDate: { gte: rangeStart, lte: rangeEnd } },
      include: { project: true },
    }),
    db.followUp.findMany({
      where: { followUpDate: { gte: rangeStart, lte: rangeEnd } },
      include: { person: true, vendor: true },
    }),
    db.meeting.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      include: { project: true },
    }),
  ]);

  return { tasks, followUps, meetings };
}

export type CalendarData = Awaited<ReturnType<typeof getCalendarData>>;
