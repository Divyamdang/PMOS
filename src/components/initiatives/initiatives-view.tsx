"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/pmos/states";
import { createInitiative } from "@/app/actions/initiatives";
import { PROJECT_STATUS_META } from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Layers } from "lucide-react";
import type { Initiative, User, Project } from "@/generated/prisma";

type InitiativeRow = Initiative & { owner: User | null; projects: (Project & { _count: { tasks: number } })[] };

export function InitiativesView({ initiatives }: { initiatives: InitiativeRow[] }) {
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>Group related projects under a bigger bet.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New initiative
        </Button>
      </div>

      {initiatives.length === 0 ? (
        <EmptyState icon={Layers} title="No initiatives yet." description="Initiatives group multiple projects under one strategic bet." action={{ label: "New initiative", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {initiatives.map((init) => (
            <div key={init.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{init.name}</p>
                  {init.description && <p className="mt-1 text-sm" style={{ color: "var(--muted-2)" }}>{init.description}</p>}
                </div>
                {init.targetDate && <span className="shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>Target {formatDate(init.targetDate)}</span>}
              </div>
              {init.projects.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {init.projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.key}`}
                      className="rounded-full border px-2.5 py-1 text-xs"
                      style={{ borderColor: "var(--border-subtle)", color: PROJECT_STATUS_META[p.status].color }}
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs" style={{ color: "var(--muted-2)" }}>No projects linked yet.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <NewInitiativeDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function NewInitiativeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createInitiative({ name: name.trim(), description: description.trim() || undefined, targetDate: targetDate ? new Date(targetDate) : null });
      toast.success("Initiative created.");
      onOpenChange(false);
      setName(""); setDescription("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New initiative</DialogTitle>
          <DialogDescription>A strategic bet that spans multiple projects.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Target date</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name.trim()}>Create initiative</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
