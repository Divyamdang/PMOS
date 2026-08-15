"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMeeting } from "@/app/actions/meetings";
import { toast } from "sonner";
import type { Person, Project } from "@/generated/prisma";

export function NewMeetingDialog({
  open,
  onOpenChange,
  people,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
  projects: Project[];
}) {
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [projectId, setProjectId] = React.useState("none");
  const [agenda, setAgenda] = React.useState("");
  const [participantIds, setParticipantIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createMeeting({
        title: title.trim(),
        date: new Date(date),
        projectId: projectId === "none" ? null : projectId,
        agenda: agenda.trim() || undefined,
        participantIds,
      });
      toast.success("Meeting scheduled.");
      onOpenChange(false);
      setTitle(""); setAgenda(""); setParticipantIds([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New meeting</DialogTitle>
          <DialogDescription>Notes and action items later — start with the basics.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="PGR sprint sync" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Participants</Label>
            <div className="flex flex-wrap gap-1.5">
              {people.map((p) => {
                const active = participantIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setParticipantIds((prev) => (active ? prev.filter((id) => id !== p.id) : [...prev, p.id]))}
                    className="rounded-full border px-2.5 py-1 text-xs"
                    style={{ borderColor: active ? "var(--route)" : "var(--border-subtle)", color: active ? "var(--route)" : "var(--muted-2)", background: active ? "var(--route-soft)" : "transparent" }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Agenda</Label>
            <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !title.trim()}>Schedule meeting</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
