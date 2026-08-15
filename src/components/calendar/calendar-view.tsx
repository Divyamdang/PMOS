"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store/ui-store";
import { PRIORITY_META } from "@/lib/domain";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarData } from "@/lib/queries/calendar";

export function CalendarView({ tasks, followUps, meetings, monthIso }: CalendarData & { monthIso: string }) {
  const router = useRouter();
  const openTaskDrawer = useUIStore((s) => s.openTaskDrawer);
  const monthDate = new Date(monthIso);
  const [selected, setSelected] = React.useState<Date | null>(null);

  const start = startOfWeek(startOfMonth(monthDate));
  const end = endOfWeek(endOfMonth(monthDate));
  const days = eachDayOfInterval({ start, end });

  function eventsFor(day: Date) {
    return {
      tasks: tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day)),
      followUps: followUps.filter((f) => f.followUpDate && isSameDay(new Date(f.followUpDate), day)),
      meetings: meetings.filter((m) => isSameDay(new Date(m.date), day)),
    };
  }

  function go(delta: number) {
    router.push(`/calendar?month=${(delta > 0 ? addMonths(monthDate, 1) : subMonths(monthDate, 1)).toISOString()}`);
  }

  const selectedEvents = selected ? eventsFor(selected) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl" style={{ fontFamily: "var(--font-display)" }}>{format(monthDate, "MMMM yyyy")}</h1>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Previous month" onClick={() => go(-1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="outline" className="h-7 w-7" aria-label="Next month" onClick={() => go(1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-subtle)", background: "var(--border-subtle)" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider" style={{ background: "var(--graphite)", color: "var(--muted-2)" }}>
            {d}
          </div>
        ))}
        {days.map((day) => {
          const events = eventsFor(day);
          const count = events.tasks.length + events.followUps.length + events.meetings.length;
          const inMonth = isSameMonth(day, monthDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelected(day)}
              className={cn("flex min-h-20 flex-col gap-1 p-1.5 text-left transition-colors hover:bg-[var(--surface-hover)]")}
              style={{
                background: isSameDay(day, selected ?? new Date(0)) ? "var(--route-soft)" : "var(--card)",
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-xs"
                style={{ background: isToday(day) ? "var(--route)" : "transparent", color: isToday(day) ? "var(--primary-foreground)" : "var(--foreground)" }}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {events.tasks.slice(0, 3).map((t) => (
                  <span key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ background: PRIORITY_META[t.priority].color }} />
                ))}
                {events.followUps.slice(0, 2).map((f) => (
                  <span key={f.id} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--amber)" }} />
                ))}
                {events.meetings.slice(0, 2).map((m) => (
                  <span key={m.id} className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--settled)" }} />
                ))}
              </div>
              {count > 0 && <span className="text-[10px]" style={{ color: "var(--muted-2)" }}>{count} event{count === 1 ? "" : "s"}</span>}
            </button>
          );
        })}
      </div>

      {selected && selectedEvents && (
        <div className="flex flex-col gap-2 rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
          <p className="text-sm font-medium">{format(selected, "EEEE, MMMM d")}</p>
          {selectedEvents.tasks.length + selectedEvents.followUps.length + selectedEvents.meetings.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-2)" }}>Nothing on this day.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {selectedEvents.tasks.map((t) => (
                <EventRow key={t.id} color={PRIORITY_META[t.priority].color} label={t.title} sub={t.project?.name} onClick={() => openTaskDrawer(t.id)} />
              ))}
              {selectedEvents.followUps.map((f) => (
                <EventRow key={f.id} color="var(--amber)" label={f.topic} sub="Follow-up" onClick={() => router.push("/follow-ups")} />
              ))}
              {selectedEvents.meetings.map((m) => (
                <EventRow key={m.id} color="var(--settled)" label={m.title} sub={format(new Date(m.date), "h:mm a")} onClick={() => router.push("/meetings")} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({ color, label, sub, onClick }: { color: string; label: string; sub?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-hover)]">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {sub && <span className="shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>{sub}</span>}
    </button>
  );
}
