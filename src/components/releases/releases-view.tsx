"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/pmos/states";
import { createRelease, updateReleaseStatus } from "@/app/actions/releases";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Rocket } from "lucide-react";
import type { Release, ReleaseProject, Project, ReleaseStatus } from "@/generated/prisma";

type ReleaseRow = Release & { projects: (ReleaseProject & { project: Project })[]; completion: number; openIssues: number; blockers: number };

const STATUS_META: Record<ReleaseStatus, { label: string; color: string }> = {
  PLANNED: { label: "Planned", color: "var(--muted-2)" },
  IN_PROGRESS: { label: "In progress", color: "var(--route)" },
  TESTING: { label: "Testing", color: "var(--amber)" },
  SHIPPED: { label: "Shipped", color: "var(--settled)" },
  DELAYED: { label: "Delayed", color: "var(--coral)" },
};

export function ReleasesView({ releases, projects }: { releases: ReleaseRow[]; projects: Project[] }) {
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{releases.length} releases</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New release
        </Button>
      </div>

      {releases.length === 0 ? (
        <EmptyState icon={Rocket} title="Nothing planned yet." description="Group projects into a release to track completion and blockers together." action={{ label: "New release", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {releases.map((r) => (
            <div key={r.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.name} {r.version && <span style={{ color: "var(--muted-2)" }}>· {r.version}</span>}</p>
                  <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {r.projects.map((p) => p.project.name).join(", ")}
                    {r.targetDate && ` · target ${formatDate(r.targetDate)}`}
                  </p>
                </div>
                <Select value={r.status} onValueChange={async (v) => { await updateReleaseStatus(r.id, v as ReleaseStatus); toast.success("Updated."); }}>
                  <SelectTrigger size="sm" className="w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={r.completion} className="h-1.5 max-w-xs" />
                <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                  {r.completion}% · {r.openIssues} open · {r.blockers} blocked
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewReleaseDialog open={newOpen} onOpenChange={setNewOpen} projects={projects} />
    </div>
  );
}

function NewReleaseDialog({ open, onOpenChange, projects }: { open: boolean; onOpenChange: (open: boolean) => void; projects: Project[] }) {
  const [name, setName] = React.useState("");
  const [version, setVersion] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [projectIds, setProjectIds] = React.useState<string[]>([]);
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createRelease({ name: name.trim(), version: version.trim() || undefined, targetDate: targetDate ? new Date(targetDate) : null, projectIds });
      toast.success("Release created.");
      onOpenChange(false);
      setName(""); setVersion(""); setProjectIds([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New release</DialogTitle>
          <DialogDescription>Bundle projects together to track ship readiness.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 Payments Release" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Version</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v2.4.0" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Target date</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Projects</Label>
            <div className="flex flex-wrap gap-1.5">
              {projects.map((p) => {
                const active = projectIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectIds((prev) => (active ? prev.filter((id) => id !== p.id) : [...prev, p.id]))}
                    className="rounded-full border px-2.5 py-1 text-xs"
                    style={{ borderColor: active ? "var(--route)" : "var(--border-subtle)", color: active ? "var(--route)" : "var(--muted-2)", background: active ? "var(--route-soft)" : "transparent" }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name.trim()}>Create release</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
