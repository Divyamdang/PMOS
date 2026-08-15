import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center",
        className
      )}
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--route-soft)" }}>
          <Icon className="h-5 w-5" style={{ color: "var(--route)" }} />
        </div>
      )}
      <p className="font-medium" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm" style={{ color: "var(--muted-2)" }}>
          {description}
        </p>
      )}
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong loading this.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center"
      style={{ borderColor: "var(--coral)", background: "var(--coral-soft)" }}
    >
      <p className="text-sm" style={{ color: "var(--foreground)" }}>
        {message}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
