"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskKeyStamp } from "@/components/pmos/task-key";
import { PriorityBadge } from "@/components/pmos/badges";
import { toggleTaskDone } from "@/app/actions/tasks";
import { dueLabel, isOverdue } from "@/lib/format";
import { useUIStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";
import type { Priority, TaskStatus } from "@/generated/prisma";

export type TaskRowData = {
  id: string;
  taskKey: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: Date | null;
  project?: { key: string; name: string } | null;
};

export function TaskRow({ task, showProject = true }: { task: TaskRowData; showProject?: boolean }) {
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(task.status === "DONE");
  const openTaskDrawer = useUIStore((s) => s.openTaskDrawer);
  const overdue = !done && isOverdue(task.dueDate);
  const due = dueLabel(task.dueDate);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    setDone(!done);
    startTransition(async () => {
      await toggleTaskDone(task.id);
    });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openTaskDrawer(task.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTaskDrawer(task.id);
        }
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--surface-hover)] cursor-pointer",
        pending && "opacity-60"
      )}
      style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}
    >
      <Checkbox checked={done} onClick={toggle} className="shrink-0" />
      <TaskKeyStamp value={task.taskKey} className="shrink-0" />
      <span className={cn("min-w-0 flex-1 truncate", done && "line-through opacity-50")}>{task.title}</span>
      {showProject && task.project && (
        <span className="hidden shrink-0 truncate text-xs sm:inline" style={{ color: "var(--muted-2)" }}>
          {task.project.name}
        </span>
      )}
      <PriorityBadge priority={task.priority} className="hidden shrink-0 sm:inline-flex" />
      {due && (
        <span
          className="shrink-0 text-xs font-medium"
          style={{ color: overdue ? "var(--coral)" : "var(--muted-2)", fontFamily: "var(--font-mono)" }}
        >
          {due}
        </span>
      )}
    </div>
  );
}
