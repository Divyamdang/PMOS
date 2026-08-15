"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/pmos/states";
import { NewWaitingForDialog } from "@/components/waiting-for/new-waiting-for-dialog";
import { updateWaitingForStatus } from "@/app/actions/waiting-for";
import { dueLabel, daysSince, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Clock3 } from "lucide-react";
import type { WaitingForItem, Person, Vendor, Project, WaitingForStatus } from "@/generated/prisma";

type Row = WaitingForItem & { person: Person | null; vendor: Vendor | null; project: Project | null };

const STATUS_LABEL: Record<WaitingForStatus, string> = { WAITING: "Waiting", FOLLOW_UP_DUE: "Follow-up due", RECEIVED: "Received", CANCELLED: "Cancelled" };

export function WaitingForView({
  items,
  people,
  vendors,
  projects,
  openNewOnLoad,
}: {
  items: Row[];
  people: Person[];
  vendors: Vendor[];
  projects: Project[];
  openNewOnLoad: boolean;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = React.useState(openNewOnLoad);
  const open = items.filter((i) => i.status === "WAITING" || i.status === "FOLLOW_UP_DUE");
  const resolved = items.filter((i) => i.status === "RECEIVED" || i.status === "CANCELLED");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>What you&apos;re blocked on, until it lands.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {open.length === 0 ? (
        <EmptyState icon={Clock3} title="Everyone is accounted for." description="Nothing outstanding right now." action={{ label: "Add something", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-2">
          {open.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.what}</p>
                <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                  {item.who}{item.person && ` (${item.person.name})`}{item.vendor && ` (${item.vendor.name})`}
                  {item.project && ` · ${item.project.name}`} · waiting since {formatDate(item.since)} ({daysSince(item.since)}d)
                </p>
              </div>
              {item.expectedDate && <span className="text-xs" style={{ color: "var(--muted-2)" }}>Expected {dueLabel(item.expectedDate)}</span>}
              <span className="text-xs font-medium" style={{ color: "var(--amber)" }}>{item.followUpDate ? dueLabel(item.followUpDate) : ""}</span>
              <Select value={item.status} onValueChange={async (v) => { await updateWaitingForStatus(item.id, v as WaitingForStatus); toast.success("Updated."); }}>
                <SelectTrigger size="sm" className="w-36 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs" style={{ color: "var(--muted-2)" }}>{resolved.length} resolved</summary>
          <div className="mt-2 flex flex-col gap-1.5">
            {resolved.map((item) => (
              <p key={item.id} className="text-xs opacity-60">{item.what} · {item.who}</p>
            ))}
          </div>
        </details>
      )}

      <NewWaitingForDialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) router.replace("/waiting-for"); }} people={people} vendors={vendors} projects={projects} />
    </div>
  );
}
