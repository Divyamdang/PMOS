import Link from "next/link";
import { RoutingLineCompact } from "@/components/pmos/routing-line";
import { HEALTH_META } from "@/lib/domain";
import type { AnalyticsData } from "@/lib/queries/analytics";

export function AnalyticsView({ createdCount, completedCount, completionRate, overdueRate, avgCycleTime, followUpsCompleted, projectStats }: AnalyticsData) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-3 text-sm font-medium">Your last 30 days</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Created" value={createdCount} />
          <StatTile label="Completed" value={completedCount} />
          <StatTile label="Completion rate" value={`${completionRate}%`} />
          <StatTile label="Overdue rate" value={`${overdueRate}%`} tone={overdueRate > 20 ? "coral" : undefined} />
          <StatTile label="Avg cycle time" value={`${avgCycleTime}d`} />
          <StatTile label="Follow-ups closed" value={followUpsCompleted} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Projects</h2>
        <div className="flex flex-col gap-2">
          {projectStats.map((p) => {
            const health = HEALTH_META[p.health];
            return (
              <Link
                key={p.id}
                href={`/projects/${p.key}`}
                className="flex items-center gap-4 rounded-lg border px-4 py-3 text-sm hover:bg-[var(--surface-hover)]"
                style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}
              >
                <span className="w-40 shrink-0 truncate font-medium">{p.name}</span>
                <RoutingLineCompact progress={p.progress} color={health.color} className="max-w-[180px]" />
                <span className="w-12 shrink-0 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted-2)" }}>{p.progress}%</span>
                <span className="w-20 shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>{p.taskTotal} tasks</span>
                <span className="w-20 shrink-0 text-xs" style={{ color: p.blocked > 0 ? "var(--coral)" : "var(--muted-2)" }}>{p.blocked} blocked</span>
                <span className="w-16 shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>{p.risks} risks</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: "coral" }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
      <p className="text-xs" style={{ color: "var(--muted-2)" }}>{label}</p>
      <p className="mt-1 text-2xl" style={{ fontFamily: "var(--font-mono)", color: tone === "coral" ? "var(--coral)" : "var(--foreground)" }}>{value}</p>
    </div>
  );
}
