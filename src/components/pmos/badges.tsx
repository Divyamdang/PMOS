import { cn } from "@/lib/utils";
import { PRIORITY_META, TASK_STATUS_META, PROJECT_STATUS_META, HEALTH_META } from "@/lib/domain";

function Pill({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
      style={{ borderColor: "var(--border-subtle)", color: "var(--foreground)" }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: keyof typeof PRIORITY_META; className?: string }) {
  const meta = PRIORITY_META[priority];
  return <Pill label={meta.label} color={meta.color} className={className} />;
}

export function TaskStatusBadge({ status, className }: { status: keyof typeof TASK_STATUS_META; className?: string }) {
  const meta = TASK_STATUS_META[status];
  return <Pill label={meta.label} color={meta.color} className={className} />;
}

export function ProjectStatusBadge({ status, className }: { status: keyof typeof PROJECT_STATUS_META; className?: string }) {
  const meta = PROJECT_STATUS_META[status];
  return <Pill label={meta.label} color={meta.color} className={className} />;
}

export function HealthLabel({ health, className }: { health: keyof typeof HEALTH_META; className?: string }) {
  const meta = HEALTH_META[health];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)} style={{ color: meta.color }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
