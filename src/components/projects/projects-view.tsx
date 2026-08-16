"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/pmos/kanban-board";
import { ProjectCard } from "@/components/pmos/project-card";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ImportProjectsDialog } from "@/components/projects/import-projects-dialog";
import { EmptyState } from "@/components/pmos/states";
import { updateProjectStatus } from "@/app/actions/projects";
import { PROJECT_KANBAN_COLUMNS, PROJECT_STATUS_META } from "@/lib/domain";
import { Search, Plus, LayoutGrid, List as ListIcon, FolderKanban, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Health, Priority, ProjectStatus } from "@/generated/prisma";

type ProjectWithProgress = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  health: Health;
  priority: Priority;
  progress: number;
  taskTotal: number;
  targetDate: Date | null;
  owner: { name: string } | null;
};

export function ProjectsView({ projects, openNewOnLoad }: { projects: ProjectWithProgress[]; openNewOnLoad: boolean }) {
  const router = useRouter();
  const [view, setView] = React.useState<"board" | "list">("board");
  const [query, setQuery] = React.useState("");
  const [newOpen, setNewOpen] = React.useState(openNewOnLoad);
  const [importOpen, setImportOpen] = React.useState(false);

  const filtered = projects.filter(
    (p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.key.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--muted-2)" }} />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="h-8 pl-8 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5" style={{ borderColor: "var(--border-subtle)" }}>
            <ViewButton active={view === "board"} onClick={() => setView("board")} icon={LayoutGrid} label="Board view" />
            <ViewButton active={view === "list"} onClick={() => setView("list")} icon={ListIcon} label="List view" />
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setImportOpen(true)}>
            <FileSpreadsheet className="h-4 w-4" /> Import
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Your product story starts here."
          description="Create your first project — routing, tasks, and risks all live under it."
          action={{ label: "New project", onClick: () => setNewOpen(true) }}
        />
      ) : view === "board" ? (
        <KanbanBoard
          id="projects-board"
          columns={PROJECT_KANBAN_COLUMNS.map((s) => ({ id: s, label: PROJECT_STATUS_META[s].label, color: PROJECT_STATUS_META[s].color }))}
          items={filtered}
          getStatus={(p) => p.status}
          onMove={(p, status) => updateProjectStatus(p.id, status)}
          renderCard={(p) => <ProjectCard project={p} />}
          emptyLabel="No projects here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.key}`}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}
            >
              <span className="w-14 shrink-0 text-xs" style={{ color: "var(--muted-2)", fontFamily: "var(--font-mono)" }}>{p.key}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
              <span className="shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>{p.owner?.name}</span>
              <span className="w-24 shrink-0 text-xs" style={{ color: PROJECT_STATUS_META[p.status].color }}>{PROJECT_STATUS_META[p.status].label}</span>
              <span className="w-12 shrink-0 text-right text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-2)" }}>{p.progress}%</span>
            </Link>
          ))}
        </div>
      )}

      <NewProjectDialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) router.replace("/projects"); }} />
      <ImportProjectsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof LayoutGrid; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn("flex h-7 w-7 items-center justify-center rounded", active && "bg-[var(--route-soft)]")}
      style={{ color: active ? "var(--route)" : "var(--muted-2)" }}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
