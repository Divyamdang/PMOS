"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/pmos/states";
import { createDocument } from "@/app/actions/documents";
import { timeAgo } from "@/lib/format";
import { Plus, FileText } from "lucide-react";
import type { Document, DocumentType, Project } from "@/generated/prisma";

const TYPE_LABEL: Record<DocumentType, string> = {
  PRD: "PRD",
  BRD: "BRD",
  MEETING_NOTES: "Meeting Notes",
  RESEARCH: "Research",
  PRODUCT_DECISION: "Product Decision",
  RELEASE_NOTES: "Release Notes",
  REQUIREMENTS: "Requirements",
  NOTES: "Notes",
};

type DocRow = Document & { project: Project | null };

export function DocumentsView({ documents, projects }: { documents: DocRow[]; projects: Project[] }) {
  const router = useRouter();
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{documents.length} documents</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New document
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Your product story starts here." description="PRDs, meeting notes, and research all live here." action={{ label: "New document", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((d) => (
            <Link
              key={d.id}
              href={`/documents/${d.id}`}
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm hover:bg-[var(--surface-hover)]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}
            >
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                  {TYPE_LABEL[d.type]}{d.project && ` · ${d.project.name}`} · updated {timeAgo(d.updatedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewDocumentDialog open={newOpen} onOpenChange={setNewOpen} projects={projects} onCreated={(id) => router.push(`/documents/${id}`)} />
    </div>
  );
}

function NewDocumentDialog({
  open,
  onOpenChange,
  projects,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<DocumentType>("NOTES");
  const [projectId, setProjectId] = React.useState("none");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const doc = await createDocument({ title: title.trim(), type, projectId: projectId === "none" ? null : projectId });
      onOpenChange(false);
      setTitle("");
      onCreated(doc.id);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>PRDs, notes, and research — linkable to a project.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !title.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
