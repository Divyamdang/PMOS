"use client";

import * as React from "react";
import { KanbanBoard } from "@/components/pmos/kanban-board";
import { TaskCard } from "@/components/pmos/task-card";
import { EmptyState } from "@/components/pmos/states";
import { Progress } from "@/components/ui/progress";
import { planTask } from "@/app/actions/my-day";
import { formatDate } from "@/lib/format";
import { Sun, PhoneCall, Video } from "lucide-react";
import type { MyDayData } from "@/lib/queries/my-day";
import type { PlanBucket } from "@/generated/prisma";

type Bucket = PlanBucket | "UNPLANNED";

const COLUMNS: { id: Bucket; label: string; color?: string }[] = [
  { id: "MUST_DO", label: "Must do", color: "var(--coral)" },
  { id: "SHOULD_DO", label: "Should do", color: "var(--amber)" },
  { id: "IF_TIME", label: "If time", color: "var(--muted-2)" },
  { id: "UNPLANNED", label: "Unplanned — drag in", color: "var(--route)" },
];

export function MyDayView({ planned, unplannedCandidates, followUpsToday, meetingsToday }: MyDayData) {
  const items = [...planned, ...unplannedCandidates];
  const done = planned.filter((t) => t.status === "DONE").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          {formatDate(new Date(), "EEEE, MMMM d")}
        </h1>
        {planned.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <Progress value={(done / planned.length) * 100} className="h-1.5 max-w-xs" />
            <span className="text-xs" style={{ color: "var(--muted-2)" }}>
              {done} of {planned.length} completed
            </span>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Sun} title="Nothing on your plate." description="Enjoy the breathing room." />
      ) : (
        <KanbanBoard
          id="my-day-board"
          columns={COLUMNS}
          items={items}
          getStatus={(t) => (t.planBucket ?? "UNPLANNED") as Bucket}
          onMove={(t, bucket) => planTask(t.id, bucket === "UNPLANNED" ? null : (bucket as PlanBucket))}
          renderCard={(t) => <TaskCard task={t} />}
          emptyLabel="Drag a task here."
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <PhoneCall className="h-3.5 w-3.5" style={{ color: "var(--muted-2)" }} /> Follow-ups due today
          </h2>
          {followUpsToday.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-2)" }}>None today.</p>
          ) : (
            followUpsToday.map((f) => (
              <div key={f.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                {f.topic} <span style={{ color: "var(--muted-2)" }}>· {f.person?.name ?? f.vendor?.name}</span>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium">
            <Video className="h-3.5 w-3.5" style={{ color: "var(--muted-2)" }} /> Meetings today
          </h2>
          {meetingsToday.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-2)" }}>Nothing scheduled.</p>
          ) : (
            meetingsToday.map((m) => (
              <div key={m.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                {m.title} <span style={{ color: "var(--muted-2)" }}>· {formatDate(m.date, "h:mm a")}{m.project ? ` · ${m.project.name}` : ""}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
