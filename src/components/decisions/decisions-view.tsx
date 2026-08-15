"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/pmos/states";
import { NewDecisionDialog } from "@/components/decisions/new-decision-dialog";
import { formatDate } from "@/lib/format";
import { Plus, GitBranch } from "lucide-react";
import type { Decision, User, Project } from "@/generated/prisma";

type DecisionRow = Decision & { owner: User | null; relatedProject: Project | null };

export function DecisionsView({ decisions, projects, openNewOnLoad }: { decisions: DecisionRow[]; projects: Project[]; openNewOnLoad: boolean }) {
  const router = useRouter();
  const [newOpen, setNewOpen] = React.useState(openNewOnLoad);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{decisions.length} decisions recorded</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New decision
        </Button>
      </div>

      {decisions.length === 0 ? (
        <EmptyState icon={GitBranch} title="No decisions recorded yet." description="Capture the calls you make so future-you remembers why." action={{ label: "Record a decision", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="relative flex flex-col gap-0 pl-5">
          <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: "var(--border-subtle)" }} />
          {decisions.map((d) => (
            <div key={d.id} className="relative pb-5">
              <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: "var(--route)" }} />
              <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <p className="font-medium">{d.decision}</p>
                {d.context && <p className="mt-1 text-sm" style={{ color: "var(--muted-2)" }}>{d.context}</p>}
                {d.reason && <p className="mt-1 text-sm"><span style={{ color: "var(--muted-2)" }}>Why: </span>{d.reason}</p>}
                <p className="mt-1.5 text-xs" style={{ color: "var(--muted-2)" }}>
                  {formatDate(d.date, "MMM d, yyyy")} · {d.owner?.name}
                  {d.relatedProject && (
                    <>
                      {" · "}
                      <Link href={`/projects/${d.relatedProject.key}`} className="hover:underline">{d.relatedProject.name}</Link>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewDecisionDialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) router.replace("/decisions"); }} projects={projects} />
    </div>
  );
}
