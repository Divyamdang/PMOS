"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/pmos/states";
import { NewFollowUpDialog } from "@/components/follow-ups/new-follow-up-dialog";
import { updateFollowUpStatus } from "@/app/actions/follow-ups";
import { FOLLOWUP_STATUS_META, PRIORITY_META } from "@/lib/domain";
import { dueLabel, isOverdue, daysSince } from "@/lib/format";
import { toast } from "sonner";
import { Plus, PhoneCall } from "lucide-react";
import type { FollowUp, Person, Vendor, Project, FollowUpStatus } from "@/generated/prisma";

type FollowUpRow = FollowUp & { person: Person | null; vendor: Vendor | null; relatedProject: Project | null };

export function FollowUpsView({
  followUps,
  people,
  vendors,
  projects,
  openNewOnLoad,
}: {
  followUps: FollowUpRow[];
  people: Person[];
  vendors: Vendor[];
  projects: Project[];
  openNewOnLoad: boolean;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = React.useState(openNewOnLoad);
  const [statusFilter, setStatusFilter] = React.useState<string>("open");

  const filtered = followUps.filter((f) => {
    if (statusFilter === "open") return !["RESOLVED", "CLOSED"].includes(f.status);
    if (statusFilter === "all") return true;
    return f.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size="sm" className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="all">All</SelectItem>
            {Object.entries(FOLLOWUP_STATUS_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New follow-up
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={PhoneCall} title="Nothing to chase." description="Every follow-up is resolved, or you haven't logged one yet." action={{ label: "New follow-up", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((f) => {
            const overdue = f.followUpDate ? isOverdue(f.followUpDate) : false;
            return (
              <div key={f.id} className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{f.topic}</p>
                  <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {f.person?.name ?? f.vendor?.name ?? "—"} · {f.channel.charAt(0) + f.channel.slice(1).toLowerCase()}
                    {f.relatedProject && ` · ${f.relatedProject.name}`}
                    {f.lastContactDate && ` · last contact ${daysSince(f.lastContactDate)}d ago`}
                  </p>
                </div>
                <span className="text-xs font-medium" style={{ color: overdue ? "var(--coral)" : "var(--muted-2)" }}>
                  {f.followUpDate ? dueLabel(f.followUpDate) : "No date"}
                </span>
                <span className="text-xs" style={{ color: PRIORITY_META[f.priority].color }}>{f.priority}</span>
                <Select value={f.status} onValueChange={async (v) => { await updateFollowUpStatus(f.id, v as FollowUpStatus); toast.success("Updated."); }}>
                  <SelectTrigger size="sm" className="w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FOLLOWUP_STATUS_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}

      <NewFollowUpDialog
        open={newOpen}
        onOpenChange={(o) => { setNewOpen(o); if (!o) router.replace("/follow-ups"); }}
        people={people}
        vendors={vendors}
        projects={projects}
      />
    </div>
  );
}
