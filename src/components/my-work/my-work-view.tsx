"use client";

import * as React from "react";
import { TaskRow } from "@/components/pmos/task-row";
import { EmptyState } from "@/components/pmos/states";
import { TASK_TYPE_META } from "@/lib/domain";
import { Briefcase } from "lucide-react";
import type { Task, Project } from "@/generated/prisma";

type TaskRow_ = Task & { project: Project | null };

const GROUP_ORDER: (keyof typeof TASK_TYPE_META)[] = ["FOLLOW_UP", "COMMUNICATION", "MEETING", "CALL", "REMINDER", "RESEARCH", "DOCUMENTATION", "TASK", "IDEA"];

export function MyWorkView({ tasks }: { tasks: TaskRow_[] }) {
  if (tasks.length === 0) {
    return <EmptyState icon={Briefcase} title="Nothing on your plate." description="Personal operational work — follow-ups, calls, reminders — will show up here." />;
  }

  const groups = GROUP_ORDER.map((type) => ({ type, items: tasks.filter((t) => t.type === type) })).filter((g) => g.items.length > 0);
  const otherTypes = tasks.filter((t) => !GROUP_ORDER.includes(t.type as never));

  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <div key={g.type} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">{TASK_TYPE_META[g.type].label}s <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>({g.items.length})</span></h2>
          <div className="flex flex-col gap-2">
            {g.items.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </div>
      ))}
      {otherTypes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Other</h2>
          <div className="flex flex-col gap-2">
            {otherTypes.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
