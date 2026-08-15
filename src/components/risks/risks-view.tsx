"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/pmos/states";
import { NewRiskDialog } from "@/components/risks/new-risk-dialog";
import { updateRiskStatus } from "@/app/actions/risks";
import { RISK_STATUS_META } from "@/lib/domain";
import { toast } from "sonner";
import { Plus, ShieldAlert } from "lucide-react";
import type { Risk, User, Project, RiskStatus } from "@/generated/prisma";

type RiskRow = Risk & { owner: User | null; project: Project | null };

export function RisksView({ risks, projects, openNewOnLoad }: { risks: RiskRow[]; projects: Project[]; openNewOnLoad: boolean }) {
  const router = useRouter();
  const [newOpen, setNewOpen] = React.useState(openNewOnLoad);
  const [statusFilter, setStatusFilter] = React.useState("active");

  const filtered = risks.filter((r) => {
    if (statusFilter === "active") return r.status === "MONITORING" || r.status === "ESCALATED";
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size="sm" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All</SelectItem>
            {Object.entries(RISK_STATUS_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New risk
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No risks here." description="Nothing's flagged in this view." action={{ label: "Log a risk", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-lg border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{r.risk}</p>
                  {r.description && <p className="mt-1 text-sm" style={{ color: "var(--muted-2)" }}>{r.description}</p>}
                  <p className="mt-1.5 text-xs" style={{ color: "var(--muted-2)" }}>
                    Probability {r.probability}/5 · Impact {r.impact}/5
                    {r.project && (
                      <>
                        {" · "}
                        <Link href={`/projects/${r.project.key}`} className="hover:underline">{r.project.name}</Link>
                      </>
                    )}
                    {r.mitigation && ` · Mitigation: ${r.mitigation}`}
                  </p>
                </div>
                <Select value={r.status} onValueChange={async (v) => { await updateRiskStatus(r.id, v as RiskStatus); toast.success("Updated."); }}>
                  <SelectTrigger size="sm" className="w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(RISK_STATUS_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewRiskDialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) router.replace("/risks"); }} projects={projects} />
    </div>
  );
}
