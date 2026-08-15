"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TaskKeyStamp } from "@/components/pmos/task-key";
import { RoutingLineCompact } from "@/components/pmos/routing-line";
import { TaskRow } from "@/components/pmos/task-row";
import { TaskCard } from "@/components/pmos/task-card";
import { KanbanBoard } from "@/components/pmos/kanban-board";
import { EmptyState } from "@/components/pmos/states";
import { Button } from "@/components/ui/button";
import { HEALTH_META, PROJECT_STATUS_META, TASK_KANBAN_COLUMNS, TASK_STATUS_META, RISK_STATUS_META } from "@/lib/domain";
import { dueLabel, formatDate, timeAgo } from "@/lib/format";
import { updateProjectHealth, updateProjectStatus, computeHealthSuggestion } from "@/app/actions/projects";
import { updateTaskStatus } from "@/app/actions/tasks";
import { toast } from "sonner";
import type { ProjectCockpitData } from "@/lib/queries/project";
import type { Health, TaskStatus } from "@/generated/prisma";
import { NewTaskDialog } from "@/components/tasks/new-task-dialog";
import { NewRiskDialog } from "@/components/risks/new-risk-dialog";
import { NewDecisionDialog } from "@/components/decisions/new-decision-dialog";
import { ShieldAlert, GitBranch, Sparkles } from "lucide-react";

export function ProjectCockpit({ data }: { data: ProjectCockpitData }) {
  const { project } = data;
  const health = HEALTH_META[project.health];
  const [suggestion, setSuggestion] = React.useState<{ health: Health; reason: string } | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [riskDialogOpen, setRiskDialogOpen] = React.useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = React.useState(false);

  React.useEffect(() => {
    computeHealthSuggestion(project.id).then((s) => {
      if (s.health !== project.health) setSuggestion(s);
    });
  }, [project.id, project.health]);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/projects" className="flex w-fit items-center gap-1 text-xs" style={{ color: "var(--muted-2)" }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Projects
      </Link>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <TaskKeyStamp value={project.key} />
            <h1 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>{project.name}</h1>
            {project.description && <p className="mt-1 max-w-xl text-sm" style={{ color: "var(--muted-2)" }}>{project.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: "var(--border-subtle)", color: health.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: health.color }} />
                  {health.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(HEALTH_META).map(([k, v]) => (
                  <DropdownMenuItem key={k} onClick={() => updateProjectHealth(project.id, k as Health)}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} /> {v.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: "var(--border-subtle)" }}>
                  {PROJECT_STATUS_META[project.status].label}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(PROJECT_STATUS_META).map(([k, v]) => (
                  <DropdownMenuItem key={k} onClick={() => updateProjectStatus(project.id, k as never)}>
                    {v.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {suggestion && (
          <button
            onClick={async () => {
              await updateProjectHealth(project.id, suggestion.health);
              toast.success("Health updated.");
              setSuggestion(null);
            }}
            className="flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
            style={{ borderColor: "var(--amber)", color: "var(--amber)", background: "var(--amber-soft)" }}
          >
            System suggests: {HEALTH_META[suggestion.health].label} — {suggestion.reason}. Apply?
          </button>
        )}

        <div className="flex items-center gap-3">
          <RoutingLineCompact progress={data.progress} color={health.color} className="max-w-md" />
          <span className="shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>
            {data.progress}% · {data.taskDone}/{data.taskTotal} tasks
            {project.targetDate && ` · due ${formatDate(project.targetDate)}`}
          </span>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="risks">Risks{data.risks.length > 0 && ` (${data.risks.length})`}</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="board" className="pt-4">
          <div className="mb-3 flex justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setTaskDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New task
            </Button>
          </div>
          {data.projectWork.length === 0 ? (
            <EmptyState title="No tasks yet." description="Break this project down into tasks to see them here." action={{ label: "New task", onClick: () => setTaskDialogOpen(true) }} />
          ) : (
            <KanbanBoard
              id={`project-board-${project.key}`}
              columns={TASK_KANBAN_COLUMNS.map((s) => ({ id: s, label: TASK_STATUS_META[s].label, color: TASK_STATUS_META[s].color }))}
              items={data.projectWork.filter((t) => !t.parentTaskId)}
              getStatus={(t) => t.status}
              onMove={(t, status) => updateTaskStatus(t.id, status as TaskStatus)}
              renderCard={(t) => <TaskCard task={t} />}
            />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="flex flex-col gap-2 pt-4">
          {data.projectWork.length === 0 ? (
            <EmptyState title="No tasks yet." action={{ label: "New task", onClick: () => setTaskDialogOpen(true) }} />
          ) : (
            data.projectWork.filter((t) => !t.parentTaskId).map((t) => <TaskRow key={t.id} task={t} showProject={false} />)
          )}
        </TabsContent>

        <TabsContent value="timeline" className="pt-4">
          <TimelineTab tasks={data.projectWork} />
        </TabsContent>

        <TabsContent value="risks" className="flex flex-col gap-2 pt-4">
          <div className="mb-1 flex justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRiskDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New risk
            </Button>
          </div>
          {data.risks.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No risks logged." description="Nothing's flagged — or nothing's been written down yet." action={{ label: "Log a risk", onClick: () => setRiskDialogOpen(true) }} />
          ) : (
            data.risks.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.risk}</p>
                  <span className="text-xs font-medium" style={{ color: RISK_STATUS_META[r.status].color }}>{RISK_STATUS_META[r.status].label}</span>
                </div>
                {r.description && <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>{r.description}</p>}
                <p className="mt-1.5 text-[11px]" style={{ color: "var(--muted-2)" }}>
                  Probability {r.probability}/5 · Impact {r.impact}/5{r.mitigation && ` · Mitigation: ${r.mitigation}`}
                </p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="decisions" className="flex flex-col gap-2 pt-4">
          <div className="mb-1 flex justify-end">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDecisionDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New decision
            </Button>
          </div>
          {data.decisions.length === 0 ? (
            <EmptyState icon={GitBranch} title="No decisions recorded." description="Capture the calls you make so future-you remembers why." action={{ label: "Record a decision", onClick: () => setDecisionDialogOpen(true) }} />
          ) : (
            data.decisions.map((d) => (
              <div key={d.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <p className="font-medium">{d.decision}</p>
                {d.reason && <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>{d.reason}</p>}
                <p className="mt-1.5 text-[11px]" style={{ color: "var(--muted-2)" }}>{formatDate(d.date, "MMM d, yyyy")} · {d.owner?.name}</p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="flex flex-col gap-2 pt-4">
          {data.documents.length === 0 ? (
            <EmptyState title="No documents yet." description="PRDs, notes, and requirements for this project will show up here." />
          ) : (
            data.documents.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <span>{doc.title}</span>
                <span className="text-xs" style={{ color: "var(--muted-2)" }}>{doc.type.replace("_", " ")}</span>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity" className="flex flex-col gap-1.5 pt-4">
          {data.activity.length === 0 ? (
            <EmptyState title="Nothing has happened here yet." />
          ) : (
            data.activity.map((e) => (
              <p key={e.id} className="text-xs" style={{ color: "var(--muted-2)" }}>
                <span style={{ color: "var(--foreground)" }}>{e.actor?.name ?? "PMOS"}</span> {e.message} · {timeAgo(e.createdAt)}
              </p>
            ))
          )}
        </TabsContent>
      </Tabs>

      <NewTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} defaultProjectId={project.id} />
      <NewRiskDialog open={riskDialogOpen} onOpenChange={setRiskDialogOpen} defaultProjectId={project.id} />
      <NewDecisionDialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen} defaultProjectId={project.id} />
    </div>
  );
}

function OverviewTab({ data }: { data: ProjectCockpitData }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <OverviewCard title="Next action">
          {data.nextAction ? (
            <TaskRow task={data.nextAction} showProject={false} />
          ) : (
            <p className="text-sm" style={{ color: "var(--muted-2)" }}>Nothing queued up.</p>
          )}
        </OverviewCard>

        <OverviewCard title={`Blockers${data.overdueTasks.length + data.blockedCount > 0 ? ` (${data.overdueTasks.length + data.blockedCount})` : ""}`}>
          {data.overdueTasks.length === 0 && data.blockedCount === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-2)" }}>Nothing blocking this project.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {data.overdueTasks.slice(0, 4).map((t) => (
                <TaskRow key={t.id} task={t} showProject={false} />
              ))}
            </div>
          )}
        </OverviewCard>

        <OverviewCard title="Waiting for">
          {data.waitingFor.length === 0 && data.followUps.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-2)" }}>Nothing outstanding.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {data.waitingFor.map((w) => (
                <p key={w.id} className="text-sm">
                  {w.what} <span style={{ color: "var(--muted-2)" }}>· {w.who} · {dueLabel(w.followUpDate)}</span>
                </p>
              ))}
              {data.followUps.map((f) => (
                <p key={f.id} className="text-sm">
                  {f.topic} <span style={{ color: "var(--muted-2)" }}>· {f.person?.name ?? f.vendor?.name} · {dueLabel(f.followUpDate)}</span>
                </p>
              ))}
            </div>
          )}
        </OverviewCard>
      </div>

      <div className="flex flex-col gap-4">
        <OverviewCard title="PM work on this project">
          {data.pmWork.length === 0 ? (
            <EmptyState icon={Sparkles} title="Nothing on your plate here." />
          ) : (
            <div className="flex flex-col gap-1.5">
              {data.pmWork.map((t) => (
                <TaskRow key={t.id} task={t} showProject={false} />
              ))}
            </div>
          )}
        </OverviewCard>

        <OverviewCard title="Recent activity">
          {data.activity.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-2)" }}>No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {data.activity.slice(0, 6).map((e) => (
                <p key={e.id} className="text-xs" style={{ color: "var(--muted-2)" }}>
                  {e.message} · {timeAgo(e.createdAt)}
                </p>
              ))}
            </div>
          )}
        </OverviewCard>
      </div>
    </div>
  );
}

function OverviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>{title}</p>
      {children}
    </div>
  );
}

function TimelineTab({ tasks }: { tasks: ProjectCockpitData["projectWork"] }) {
  const dated = tasks.filter((t) => t.dueDate);
  if (dated.length === 0) {
    return <EmptyState title="No dated tasks yet." description="Add due dates to tasks to see them on the timeline." />;
  }
  const dates = dated.map((t) => +new Date(t.dueDate!));
  const min = Math.min(...dates);
  const max = Math.max(...dates, min + 1000 * 60 * 60 * 24 * 7);
  const span = max - min || 1;

  return (
    <div className="flex flex-col gap-2">
      {dated
        .sort((a, b) => +new Date(a.dueDate!) - +new Date(b.dueDate!))
        .map((t) => {
          const pct = ((+new Date(t.dueDate!) - min) / span) * 100;
          return (
            <div key={t.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-xs">{t.title}</span>
              <div className="relative h-1.5 flex-1 rounded-full" style={{ background: "var(--border-subtle)" }}>
                <span
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full"
                  style={{ left: `${pct}%`, background: TASK_STATUS_META[t.status].color }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs" style={{ color: "var(--muted-2)", fontFamily: "var(--font-mono)" }}>
                {formatDate(t.dueDate)}
              </span>
            </div>
          );
        })}
    </div>
  );
}
