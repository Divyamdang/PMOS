import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RoutingLineCompact } from "@/components/pmos/routing-line";
import { HEALTH_META } from "@/lib/domain";
import { dueLabel } from "@/lib/format";
import { TaskKeyStamp } from "@/components/pmos/task-key";
import type { Health } from "@/generated/prisma";

export function ProjectCard({
  project,
}: {
  project: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    health: Health;
    progress: number;
    taskTotal: number;
    targetDate: Date | null;
  };
}) {
  const health = HEALTH_META[project.health];
  const due = dueLabel(project.targetDate);

  return (
    <Link href={`/projects/${project.key}`}>
      <Card
        className="group flex flex-col gap-3 p-4 transition-colors hover:border-[var(--route)]"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <TaskKeyStamp value={project.key} />
            <h3 className="mt-1 truncate text-[15px] font-medium">{project.name}</h3>
          </div>
          <span className="flex items-center gap-1.5 shrink-0 text-xs font-medium" style={{ color: health.color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: health.color }} />
            {health.label}
          </span>
        </div>
        {project.description && (
          <p className="line-clamp-2 text-sm" style={{ color: "var(--muted-2)" }}>
            {project.description}
          </p>
        )}
        <RoutingLineCompact progress={project.progress} color={health.color} />
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-2)" }}>
          <span>
            {project.progress}% · {project.taskTotal} tasks
          </span>
          {due && <span>{due}</span>}
        </div>
      </Card>
    </Link>
  );
}
