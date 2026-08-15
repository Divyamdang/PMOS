import { cn } from "@/lib/utils";

/** The stamped-ledger key treatment from DESIGN_SYSTEM.md — replaces the
 * standard gray monospace chip every tracker uses. */
export function TaskKeyStamp({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "group/key inline-flex items-baseline gap-0 border-b text-[13px] tracking-[0.08em] transition-colors",
        className
      )}
      style={{
        fontFamily: "var(--font-mono)",
        color: "var(--muted-2)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <span className="group-hover/key:text-[var(--route)] transition-colors">{value}</span>
    </span>
  );
}
