"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTask } from "@/app/actions/tasks";
import { Switch } from "@/components/ui/switch";
import { PRIORITY_META, TASK_TYPE_META, isOwnWorkType } from "@/lib/domain";
import { toast } from "sonner";
import type { Priority, TaskType } from "@/generated/prisma";

export function NewTaskDialog({
  open,
  onOpenChange,
  defaultProjectId,
  projects,
  isPersonal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  projects?: { id: string; key: string; name: string }[];
  /** Force the own-work flag instead of deriving it from the task type.
   * Left undefined normally, so the type drives the default. */
  isPersonal?: boolean;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<TaskType>("TASK");
  const [priority, setPriority] = React.useState<Priority>("P2");
  const [projectId, setProjectId] = React.useState<string>(defaultProjectId ?? "none");
  const [dueDate, setDueDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  /** null = follow the task type; true/false = the user has decided. Derived at
   * render rather than synced in an effect, same as NewProjectDialog's key. */
  const [ownWorkOverride, setOwnWorkOverride] = React.useState<boolean | null>(isPersonal ?? null);
  const ownWork = ownWorkOverride ?? isOwnWorkType(type);

  async function submit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const task = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        projectId: projectId === "none" ? null : projectId,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPersonal: ownWork,
      });
      toast.success("Task created.", { description: task.taskKey });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setOwnWorkOverride(isPersonal ?? null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>What needs to get done?</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Integrate Cashfree" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional detail…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {projects && (
              <div className="flex flex-col gap-1.5">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div
            className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="own-work" className="cursor-pointer">My own work</Label>
              <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                {ownWork
                  ? "Shows up in My Day."
                  : "Tracked on the project board, kept out of My Day."}
              </p>
            </div>
            <Switch id="own-work" checked={ownWork} onCheckedChange={setOwnWorkOverride} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !title.trim()}>Create task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
