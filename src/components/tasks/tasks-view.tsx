"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanBoard } from "@/components/pmos/kanban-board";
import { TaskCard } from "@/components/pmos/task-card";
import { EmptyState } from "@/components/pmos/states";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { PriorityBadge, TaskStatusBadge } from "@/components/pmos/badges";
import { TaskKeyStamp } from "@/components/pmos/task-key";
import { updateTaskStatus } from "@/app/actions/tasks";
import { useUIStore } from "@/lib/store/ui-store";
import { TASK_KANBAN_COLUMNS, TASK_STATUS_META } from "@/lib/domain";
import { dueLabel, isOverdue } from "@/lib/format";
import { Search, Plus, LayoutGrid, List as ListIcon, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/generated/prisma";

type TaskWithRelations = Task & {
  project: { key: string; name: string } | null;
  assignee: { name: string } | null;
  subtasks: { status: string }[];
  _count: { comments: number; attachments: number };
};

const FILTERS = ["all", "overdue", "blocked", "today", "mine"] as const;
type Filter = (typeof FILTERS)[number];

export function TasksView({
  tasks,
  projects,
  openNewOnLoad,
  initialFilter,
  initialQuery,
  initialProject,
}: {
  tasks: TaskWithRelations[];
  projects: { id: string; key: string; name: string }[];
  openNewOnLoad: boolean;
  initialFilter?: string;
  initialQuery?: string;
  initialProject?: string;
}) {
  const router = useRouter();
  const openTaskDrawer = useUIStore((s) => s.openTaskDrawer);
  const [view, setView] = React.useState<"board" | "list">("board");
  const [query, setQuery] = React.useState(initialQuery ?? "");
  const [filter, setFilter] = React.useState<Filter>((FILTERS as readonly string[]).includes(initialFilter ?? "") ? (initialFilter as Filter) : "all");
  const [projectFilter, setProjectFilter] = React.useState<string>(initialProject && projects.some((p) => p.key === initialProject) ? initialProject : "all");
  const [newOpen, setNewOpen] = React.useState(openNewOnLoad);
  const [sortKey, setSortKey] = React.useState<"priority" | "due" | "title">("priority");

  const q = query.toLowerCase();
  let filtered = tasks.filter(
    (t) => t.title.toLowerCase().includes(q) || t.taskKey.toLowerCase().includes(q) || t.assignee?.name.toLowerCase().includes(q) || t.project?.name.toLowerCase().includes(q)
  );
  if (projectFilter !== "all") filtered = filtered.filter((t) => t.project?.key === projectFilter);
  if (filter === "overdue") filtered = filtered.filter((t) => t.status !== "DONE" && isOverdue(t.dueDate));
  if (filter === "blocked") filtered = filtered.filter((t) => t.status === "BLOCKED");
  if (filter === "today") filtered = filtered.filter((t) => t.dueDate && dueLabel(t.dueDate) === "Today");
  if (filter === "mine") filtered = filtered.filter((t) => t.isPersonal);

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "priority") return a.priority.localeCompare(b.priority);
    if (sortKey === "due") return (a.dueDate ? +new Date(a.dueDate) : Infinity) - (b.dueDate ? +new Date(b.dueDate) : Infinity);
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--muted-2)" }} />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks…" className="h-8 pl-8 text-sm" />
          </div>
          <FilterChips value={filter} onChange={setFilter} />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger size="sm" className="h-8 text-xs"><SelectValue placeholder="All projects" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.key}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5" style={{ borderColor: "var(--border-subtle)" }}>
            <ViewButton active={view === "board"} onClick={() => setView("board")} icon={LayoutGrid} />
            <ViewButton active={view === "list"} onClick={() => setView("list")} icon={ListIcon} />
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New task
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nothing here." description="Try a different filter, or create a new task." action={{ label: "New task", onClick: () => setNewOpen(true) }} />
      ) : view === "board" ? (
        <KanbanBoard
          id="tasks-board"
          columns={TASK_KANBAN_COLUMNS.map((s) => ({ id: s, label: TASK_STATUS_META[s].label, color: TASK_STATUS_META[s].color }))}
          items={sorted}
          getStatus={(t) => t.status}
          onMove={(t, status) => updateTaskStatus(t.id, status as TaskStatus)}
          renderCard={(t) => <TaskCard task={t} />}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => setSortKey("title")}>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer" onClick={() => setSortKey("priority")}>Priority</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="cursor-pointer" onClick={() => setSortKey("due")}>Due</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((t) => {
                const done = t.subtasks.filter((s) => s.status === "DONE").length;
                return (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => openTaskDrawer(t.id)}>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-2">
                        <TaskKeyStamp value={t.taskKey} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    </TableCell>
                    <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell className="text-xs" style={{ color: "var(--muted-2)" }}>{t.assignee?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs" style={{ color: "var(--muted-2)" }}>{t.project?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs" style={{ color: t.dueDate && isOverdue(t.dueDate) ? "var(--coral)" : "var(--muted-2)", fontFamily: "var(--font-mono)" }}>
                      {dueLabel(t.dueDate) ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs" style={{ color: "var(--muted-2)" }}>{t.type.replace("_", " ")}</TableCell>
                    <TableCell className="text-xs" style={{ color: "var(--muted-2)" }}>
                      {t.subtasks.length > 0 ? `${done}/${t.subtasks.length}` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <NewTaskDialog
        open={newOpen}
        onOpenChange={(o) => {
          setNewOpen(o);
          if (!o) router.replace("/tasks");
        }}
        projects={projects}
      />
    </div>
  );
}

function FilterChips({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const labels: Record<Filter, string> = { all: "All", overdue: "Overdue", blocked: "Blocked", today: "Today", mine: "Mine" };
  return (
    <div className="flex items-center gap-1">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn("rounded-full border px-2.5 py-1 text-xs font-medium transition-colors")}
          style={{
            borderColor: value === f ? "var(--route)" : "var(--border-subtle)",
            color: value === f ? "var(--route)" : "var(--muted-2)",
            background: value === f ? "var(--route-soft)" : "transparent",
          }}
        >
          {labels[f]}
        </button>
      ))}
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon }: { active: boolean; onClick: () => void; icon: typeof LayoutGrid }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex h-7 w-7 items-center justify-center rounded", active && "bg-[var(--route-soft)]")}
      style={{ color: active ? "var(--route)" : "var(--muted-2)" }}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
