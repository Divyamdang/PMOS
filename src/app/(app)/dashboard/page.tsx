import Link from "next/link";
import { getDashboardData } from "@/lib/queries/dashboard";
import { RoutingLine, type RoutingNode } from "@/components/pmos/routing-line";
import { ProjectCard } from "@/components/pmos/project-card";
import { TaskRow } from "@/components/pmos/task-row";
import { EmptyState } from "@/components/pmos/states";
import { Progress } from "@/components/ui/progress";
import { dueLabel, formatDate } from "@/lib/format";
import { PRIORITY_META, TASK_KANBAN_COLUMNS } from "@/lib/domain";
import { AlertTriangle, PhoneCall, Clock3, Ban, ArrowRight, Sparkles } from "lucide-react";
import { AIToolsMenu } from "@/components/dashboard/ai-tools-menu";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusLine(a: { overdue: number; dueToday: number; blocked: number; followUpsDue: number; waitingDue: number }) {
  const urgent = a.overdue + a.blocked;
  const waiting = a.followUpsDue + a.waitingDue;
  if (urgent === 0 && a.dueToday === 0 && waiting === 0) {
    return "Nothing urgent on the ledger. Smooth sailing.";
  }
  const parts: string[] = [];
  if (urgent > 0) parts.push(`${urgent} thing${urgent === 1 ? "" : "s"} need${urgent === 1 ? "s" : ""} you`);
  if (a.dueToday > 0) parts.push(`${a.dueToday} due today`);
  if (waiting > 0) parts.push(`${waiting} waiting on someone else`);
  return parts.join(" · ") + ".";
}

const STAGE_LABELS: Record<(typeof TASK_KANBAN_COLUMNS)[number], string> = {
  BACKLOG: "Todo",
  TODO: "Todo",
  IN_PROGRESS: "In Motion",
  WAITING: "Waiting",
  BLOCKED: "Blocked",
  DONE: "Done",
};
const STAGES = ["Todo", "In Motion", "Waiting", "Blocked", "Done"];
const STAGE_INDEX: Record<string, number> = { Todo: 0, "In Motion": 1, Waiting: 2, Blocked: 3, Done: 4 };

export default async function DashboardPage() {
  const data = await getDashboardData();
  const firstName = data.user.name.split(" ")[0];

  const nodes: RoutingNode[] = data.activeTasks.map((t) => ({
    id: t.id,
    label: `${t.taskKey} ${t.title}`,
    sublabel: t.project?.name,
    stage: STAGE_INDEX[STAGE_LABELS[t.status]],
    color: PRIORITY_META[t.priority].color,
  }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}>
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-2)" }}>
            {statusLine(data.attention)}
          </p>
        </div>
        <AIToolsMenu />
      </section>

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
            The Routing Line — today's work
          </p>
          <Link href="/tasks" className="flex items-center gap-1 text-xs" style={{ color: "var(--route)" }}>
            View all tasks <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {nodes.length > 0 ? (
          <RoutingLine stages={STAGES} nodes={nodes} />
        ) : (
          <p className="py-8 text-center text-sm" style={{ color: "var(--muted-2)" }}>
            Nothing in motion right now.
          </p>
        )}
      </section>

      {(data.attention.overdue > 0 || data.attention.blocked > 0 || data.attention.followUpsDue > 0 || data.attention.waitingDue > 0) && (
        <section className="flex flex-wrap gap-2">
          {data.attention.overdue > 0 && <AttentionChip icon={AlertTriangle} label={`${data.attention.overdue} overdue`} color="var(--coral)" href="/tasks?filter=overdue" />}
          {data.attention.blocked > 0 && <AttentionChip icon={Ban} label={`${data.attention.blocked} blocked`} color="var(--coral)" href="/tasks?filter=blocked" />}
          {data.attention.followUpsDue > 0 && <AttentionChip icon={PhoneCall} label={`${data.attention.followUpsDue} follow-ups due`} color="var(--amber)" href="/follow-ups" />}
          {data.attention.waitingDue > 0 && <AttentionChip icon={Clock3} label={`${data.attention.waitingDue} waiting-for due`} color="var(--amber)" href="/waiting-for" />}
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <section className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">My Day</h2>
            <Link href="/my-day" className="text-xs" style={{ color: "var(--route)" }}>
              Open planner
            </Link>
          </div>
          {data.myDayTasks.length > 0 ? (
            <>
              <Progress value={data.myDayTasks.length ? (data.myDayDone / data.myDayTasks.length) * 100 : 0} className="h-1.5" />
              <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                {data.myDayDone} of {data.myDayTasks.length} completed
              </p>
              <div className="flex flex-col gap-2">
                {data.myDayTasks.slice(0, 6).map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={Sparkles} title="Nothing on your plate." description="Enjoy the breathing room." />
          )}
        </section>

        <section className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Projects</h2>
            <Link href="/projects" className="text-xs" style={{ color: "var(--route)" }}>
              All projects
            </Link>
          </div>
          {data.projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="Your product story starts here." description="Create your first project to see it on the board." />
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Waiting for</h2>
            <Link href="/waiting-for" className="text-xs" style={{ color: "var(--route)" }}>
              View all
            </Link>
          </div>
          {data.waitingDue.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.waitingDue.map((w) => (
                <div key={w.id} className="rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                  <p className="font-medium">{w.what}</p>
                  <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {w.who} {w.project ? `· ${w.project.name}` : ""} · {dueLabel(w.followUpDate)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Everyone is accounted for." />
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Upcoming</h2>
            <Link href="/calendar" className="text-xs" style={{ color: "var(--route)" }}>
              Calendar
            </Link>
          </div>
          {data.upcomingMeetings.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.upcomingMeetings.map((m) => (
                <div key={m.id} className="rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                  <p className="font-medium">{m.title}</p>
                  <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {formatDate(m.date, "EEE, MMM d 'at' h:mm a")} {m.project ? `· ${m.project.name}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing on the calendar." description="Meetings you schedule will show up here." />
          )}
        </section>
      </div>
    </div>
  );
}

function AttentionChip({ icon: Icon, label, color, href }: { icon: typeof AlertTriangle; label: string; color: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:brightness-110"
      style={{ borderColor: color, color, background: `color-mix(in oklab, ${color} 12%, transparent)` }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
