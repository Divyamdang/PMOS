"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type RoutingNode = {
  id: string;
  label: string;
  stage: number; // 0-based index into `stages`
  color: string; // css color (var(--settled) etc)
  sublabel?: string;
};

type RoutingLineHeroProps = {
  variant?: "hero";
  stages: string[];
  nodes: RoutingNode[];
  className?: string;
};

/**
 * The Routing Line — PMOS's signature element (see DESIGN_SYSTEM.md).
 * Renders today's work as nodes traveling along a stage line instead of a
 * generic stat-card row.
 */
export function RoutingLine({ stages, nodes, className }: RoutingLineHeroProps) {
  // group nodes by stage so we can stack them vertically without overlap
  const byStage = React.useMemo(() => {
    const map = new Map<number, RoutingNode[]>();
    for (const n of nodes) {
      const arr = map.get(n.stage) ?? [];
      arr.push(n);
      map.set(n.stage, arr);
    }
    return map;
  }, [nodes]);

  return (
    <div className={cn("w-full", className)}>
      <div className="relative h-28 sm:h-24">
        {/* the line itself */}
        <div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
          style={{ background: "var(--border-subtle)" }}
        />
        {/* stage ticks + labels */}
        <div className="absolute inset-0 flex">
          {stages.map((stage, i) => (
            <div key={stage} className="relative flex-1">
              <div
                className="absolute top-1/2 left-0 h-2 w-px -translate-y-1/2"
                style={{ background: "var(--border-subtle)" }}
              />
              <span
                className="absolute bottom-0 left-0 text-[11px] uppercase tracking-wider whitespace-nowrap"
                style={{ color: "var(--muted-2)", fontFamily: "var(--font-mono)" }}
              >
                {stage}
              </span>
              {(byStage.get(i) ?? []).slice(0, 5).map((node, ni) => (
                <RoutingDot key={node.id} node={node} indexInStage={ni} />
              ))}
              {(byStage.get(i) ?? []).length > 5 && (
                <span
                  className="absolute top-1/2 text-[10px]"
                  style={{
                    left: `${20 + 5 * 16}px`,
                    transform: "translateY(-50%)",
                    color: "var(--muted-2)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  +{(byStage.get(i) ?? []).length - 5}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="sr-only">
        {nodes.map((n) => (
          <span key={n.id}>
            {n.label} in {stages[n.stage]}.{" "}
          </span>
        ))}
      </div>
    </div>
  );
}

function RoutingDot({ node, indexInStage }: { node: RoutingNode; indexInStage: number }) {
  const offset = 18 + indexInStage * 16;
  return (
    <div
      className="group absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
      style={{ left: `${offset}px` }}
    >
      <span
        className="routing-node block h-2.5 w-2.5 rounded-full ring-2"
        style={{
          background: node.color,
          // @ts-expect-error css var
          "--ring-color": "var(--background)",
          boxShadow: `0 0 0 2px var(--background)`,
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100"
        style={{ background: "var(--popover)", borderColor: "var(--border-subtle)", color: "var(--foreground)" }}
      >
        {node.label}
        {node.sublabel && <span style={{ color: "var(--muted-2)" }}> · {node.sublabel}</span>}
      </div>
    </div>
  );
}

/** Compact version: a short progress line with a health-colored position
 * marker. Used wherever a colored-dot health badge would otherwise appear
 * (project cards, cockpit header, list rows). */
export function RoutingLineCompact({
  progress,
  color,
  className,
}: {
  progress: number;
  color: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, progress));
  return (
    <div className={cn("relative h-1.5 w-full overflow-visible rounded-full", className)} style={{ background: "var(--border-subtle)" }}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
      <span
        className="routing-node absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 -translate-x-1/2 rounded-full"
        style={{ left: `${pct}%`, background: color, boxShadow: "0 0 0 2px var(--card)" }}
      />
    </div>
  );
}
