"use client";

import { Card } from "@/components/ui/card";
import { TaskKeyStamp } from "@/components/pmos/task-key";
import { PriorityBadge } from "@/components/pmos/badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { dueLabel, isOverdue } from "@/lib/format";
import { useUIStore } from "@/lib/store/ui-store";
import { MessageSquare, Paperclip, ListChecks } from "lucide-react";
import type { Priority, Task } from "@/generated/prisma";

export type TaskCardData = Pick<Task, "id" | "taskKey" | "title" | "priority" | "dueDate" | "labels"> & {
  assignee?: { name: string } | null;
  subtasks?: { status: string }[];
  _count?: { comments?: number; attachments?: number };
};

export function TaskCard({ task }: { task: TaskCardData }) {
  const openTaskDrawer = useUIStore((s) => s.openTaskDrawer);
  const due = dueLabel(task.dueDate);
  const overdue = isOverdue(task.dueDate);
  const subtaskDone = task.subtasks?.filter((s) => s.status === "DONE").length ?? 0;
  const subtaskTotal = task.subtasks?.length ?? 0;
  const labels = task.labels?.split(",").map((l) => l.trim()).filter(Boolean) ?? [];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => openTaskDrawer(task.id)}
      onKeyDown={(e) => e.key === "Enter" && openTaskDrawer(task.id)}
      className="cursor-pointer gap-2 p-3 transition-colors hover:border-[var(--route)]"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <TaskKeyStamp value={task.taskKey} />
        {task.assignee && (
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px]">{task.assignee.name[0]}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <p className="text-sm leading-snug">{task.title}</p>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {labels.map((l) => (
            <span key={l} className="rounded-full border px-1.5 py-0 text-[10px]" style={{ borderColor: "var(--border-subtle)", color: "var(--muted-2)" }}>
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-1">
        <PriorityBadge priority={task.priority as Priority} />
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--muted-2)" }}>
          {subtaskTotal > 0 && (
            <span className="flex items-center gap-0.5">
              <ListChecks className="h-3 w-3" /> {subtaskDone}/{subtaskTotal}
            </span>
          )}
          {!!task._count?.comments && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" /> {task._count.comments}
            </span>
          )}
          {!!task._count?.attachments && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" /> {task._count.attachments}
            </span>
          )}
          {due && (
            <span style={{ color: overdue ? "var(--coral)" : "var(--muted-2)", fontFamily: "var(--font-mono)" }}>{due}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
