"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiDraftTask } from "@/app/actions/ai";
import { convertInboxItemWithDraft } from "@/app/actions/inbox";
import { PRIORITY_META, TASK_TYPE_META } from "@/lib/domain";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import type { TaskDraft } from "@/lib/ai/service";
import type { Priority, TaskType } from "@/generated/prisma";

export function AITaskDraftDialog({
  open,
  onOpenChange,
  itemId,
  text,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  text: string;
  projects: { id: string; key: string; name: string }[];
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<TaskDraft | null>(null);
  const [projectId, setProjectId] = React.useState<string>("none");
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setDraft(null);
      setError(null);
      return;
    }
    setLoading(true);
    aiDraftTask(text).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setDraft(result.data);
      const matched = projects.find((p) => p.key === result.data.suggestedProjectKey);
      setProjectId(matched?.id ?? "none");
    });
  }, [open, text, projects]);

  async function confirm() {
    if (!draft) return;
    setCreating(true);
    const task = await convertInboxItemWithDraft(itemId, {
      title: draft.title,
      type: draft.type as TaskType,
      priority: draft.priority,
      description: [draft.description, draft.acceptanceCriteria ? `Acceptance criteria: ${draft.acceptanceCriteria}` : ""].filter(Boolean).join("\n\n"),
      subtasks: draft.subtasks,
      projectId: projectId === "none" ? null : projectId,
    });
    setCreating(false);
    onOpenChange(false);
    toast.success("Task created.", { description: task.taskKey });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--route)" }} /> AI-drafted task
          </DialogTitle>
          <DialogDescription>Review before it&apos;s created — nothing is written until you confirm.</DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm" style={{ color: "var(--muted-2)" }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Drafting…
          </div>
        )}
        {error && <p className="text-sm" style={{ color: "var(--coral)" }}>{error}</p>}
        {draft && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Type</Label>
                <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v })}>
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
                <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
            </div>
            {draft.subtasks.length > 0 && (
              <div className="flex flex-col gap-1">
                <Label>Subtasks</Label>
                {draft.subtasks.map((s, i) => (
                  <Input
                    key={i}
                    value={s}
                    onChange={(e) => {
                      const next = [...draft.subtasks];
                      next[i] = e.target.value;
                      setDraft({ ...draft, subtasks: next });
                    }}
                    className="h-7 text-xs"
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm} disabled={!draft || creating || !!error}>
            {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
