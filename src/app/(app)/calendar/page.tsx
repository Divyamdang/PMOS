import { getCalendarData } from "@/lib/queries/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const monthDate = params.month ? new Date(params.month) : new Date();
  const data = await getCalendarData(monthDate);
  return <CalendarView {...data} monthIso={monthDate.toISOString()} />;
}
