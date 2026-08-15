"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUIStore } from "@/lib/store/ui-store";
import { getTaskDetail, updateTask, addSubtask, addComment, toggleTaskDone, archiveTask, listAssignableUsers } from "@/app/actions/tasks";
import { TaskKeyStamp } from "@/components/pmos/task-key";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingState } from "@/components/pmos/states";
import { PRIORITY_META, TASK_STATUS_META } from "@/lib/domain";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { Trash2, Link2 } from "lucide-react";
import type { Priority, TaskStatus } from "@/generated/prisma";

type TaskDetail = NonNullable<Awaited<ReturnType<typeof getTaskDetail>>>;

export function TaskDrawer() {
  const taskId = useUIStore((s) => s.taskDrawerTaskId);
  const close = useUIStore((s) => s.closeTaskDrawer);
  const [task, setTask] = React.useState<TaskDetail | null>(null);
  const [users, setUsers] = React.useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const [t, u] = await Promise.all([getTaskDetail(taskId), listAssignableUsers()]);
    setTask(t);
    setUsers(u);
    setLoading(false);
  }, [taskId]);

  React.useEffect(() => {
    if (taskId) load();
  }, [taskId, load]);

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {loading || !task ? (
          <div className="p-6">
            <LoadingState rows={4} />
          </div>
        ) : (
          <TaskDrawerBody key={task.id} task={task} users={users} onChange={load} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TaskDrawerBody({ task, users, onChange }: { task: TaskDetail; users: { id: string; name: string }[]; onChange: () => void }) {
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description ?? "");
  const [comment, setComment] = React.useState("");
  const [newSubtask, setNewSubtask] = React.useState("");
  const closeDrawer = useUIStore((s) => s.closeTaskDrawer);

  // No sync-on-prop-change effect needed: TaskDrawerBody is remounted via
  // `key={task.id}` whenever the drawer switches tasks, so useState's
  // initializer already picks up the right title/description per task.

  async function saveField(data: Parameters<typeof updateTask>[1]) {
    await updateTask(task.id, data);
    onChange();
  }

  const doneSubtasks = task.subtasks.filter((s) => s.status === "DONE").length;

  return (
    <div className="flex flex-col">
      <SheetHeader className="gap-3 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center justify-between">
          <TaskKeyStamp value={task.taskKey} />
          <button
            className="flex items-center gap-1 text-xs hover:text-[var(--coral)]"
            style={{ color: "var(--muted-2)" }}
            onClick={async () => {
              await archiveTask(task.id);
              toast("Task archived.", { description: `${task.taskKey} was archived.` });
              closeDrawer();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Archive
          </button>
        </div>
        <SheetTitle asChild>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== task.title && saveField({ title })}
            className="border-none px-0 text-lg font-medium shadow-none focus-visible:ring-0"
          />
        </SheetTitle>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select value={task.status} onValueChange={(v) => saveField({ status: v as TaskStatus })}>
              <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TASK_STATUS_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={task.priority} onValueChange={(v) => saveField({ priority: v as Priority })}>
              <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Assignee">
            <Select value={task.assigneeId ?? "none"} onValueChange={(v) => saveField({ assigneeId: v === "none" ? null : v })}>
              <SelectTrigger size="sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Due date">
            <Input
              type="date"
              defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""}
              onBlur={(e) => saveField({ dueDate: e.target.value ? new Date(e.target.value) : null })}
              className="h-8 text-sm"
            />
          </Field>
        </div>

        {task.project && (
          <p className="text-xs" style={{ color: "var(--muted-2)" }}>
            In <span style={{ color: "var(--foreground)" }}>{task.project.name}</span>
            {task.parentTask && (
              <>
                {" "}
                · sub-task of <span style={{ color: "var(--foreground)" }}>{task.parentTask.taskKey}</span>
              </>
            )}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>Description</p>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (task.description ?? "") && saveField({ description })}
            placeholder="Add more detail…"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>
              Subtasks {task.subtasks.length > 0 && `(${doneSubtasks}/${task.subtasks.length})`}
            </p>
          </div>
          {task.subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={s.status === "DONE"}
                onClick={async () => {
                  await toggleTaskDone(s.id);
                  onChange();
                }}
              />
              <span className={s.status === "DONE" ? "line-through opacity-50" : ""}>{s.title}</span>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add a subtask…"
              className="h-8 text-sm"
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newSubtask.trim()) {
                  await addSubtask(task.id, newSubtask.trim());
                  setNewSubtask("");
                  onChange();
                }
              }}
            />
          </div>
        </div>

        {(task.dependenciesFrom.length > 0 || task.dependenciesTo.length > 0) && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>Dependencies</p>
            {task.dependenciesFrom.map((d) => (
              <p key={d.id} className="flex items-center gap-1.5 text-sm">
                <Link2 className="h-3.5 w-3.5" style={{ color: "var(--muted-2)" }} />
                <span style={{ color: "var(--muted-2)" }}>{d.type.replace("_", " ").toLowerCase()}</span> {d.toTask.taskKey}
              </p>
            ))}
            {task.dependenciesTo.map((d) => (
              <p key={d.id} className="flex items-center gap-1.5 text-sm">
                <Link2 className="h-3.5 w-3.5" style={{ color: "var(--muted-2)" }} />
                {d.fromTask.taskKey} <span style={{ color: "var(--muted-2)" }}>{d.type.replace("_", " ").toLowerCase()}</span> this
              </p>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>Comments</p>
          {task.comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">{c.author?.name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p>{c.body}</p>
                <p className="text-[11px]" style={{ color: "var(--muted-2)" }}>
                  {c.author?.name} · {timeAgo(c.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment…"
              className="h-8 text-sm"
              onKeyDown={async (e) => {
                if (e.key === "Enter" && comment.trim()) {
                  await addComment(task.id, comment.trim());
                  setComment("");
                  onChange();
                }
              }}
            />
          </div>
        </div>

        {task.activityEvents.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>Activity</p>
            {task.activityEvents.map((e) => (
              <p key={e.id} className="text-xs" style={{ color: "var(--muted-2)" }}>
                {e.actor?.name ?? "Someone"} {e.message} · {timeAgo(e.createdAt)}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>{label}</label>
      {children}
    </div>
  );
}
