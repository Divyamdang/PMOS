"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProject } from "@/app/actions/projects";
import { PRIORITY_META } from "@/lib/domain";
import { toast } from "sonner";
import type { Priority } from "@/generated/prisma";

export function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [manualKey, setManualKey] = React.useState("");
  const [keyEdited, setKeyEdited] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("P2");
  const [targetDate, setTargetDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Derived during render rather than synced via effect — the key follows
  // the name automatically until the user types their own.
  const autoKey = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  const key = keyEdited ? manualKey : autoKey;

  async function submit() {
    if (!name.trim() || !key.trim()) return;
    setSubmitting(true);
    try {
      const project = await createProject({
        key: key.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        targetDate: targetDate ? new Date(targetDate) : null,
      });
      toast.success("Project created.", { description: `${project.key} is ready.` });
      onOpenChange(false);
      setName("");
      setManualKey("");
      setKeyEdited(false);
      setDescription("");
      router.push(`/projects/${project.key}`);
    } catch {
      toast.error("Couldn't create project.", { description: "That key might already be in use." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>Give it a name — PMOS will track routing, tasks, risks, and decisions under it.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dynamic PG Routing" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Key</Label>
              <Input
                value={key}
                onChange={(e) => {
                  setManualKey(e.target.value.toUpperCase());
                  setKeyEdited(true);
                }}
                placeholder="PGR"
                className="w-20"
                maxLength={6}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What is this project about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="flex flex-col gap-1.5">
              <Label>Target date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name.trim() || !key.trim()}>Create project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
