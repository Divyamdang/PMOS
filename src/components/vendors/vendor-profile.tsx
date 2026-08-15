import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TaskRow } from "@/components/pmos/task-row";
import { EmptyState } from "@/components/pmos/states";
import { dueLabel } from "@/lib/format";
import type { Vendor, VendorProject, Project, FollowUp, Task } from "@/generated/prisma";

type VendorDetail = Vendor & {
  projects: (VendorProject & { project: Project })[];
  followUps: FollowUp[];
  tasks: (Task & { project: Project | null })[];
};

export function VendorProfile({ vendor }: { vendor: VendorDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <Link href="/vendors" className="flex w-fit items-center gap-1 text-xs" style={{ color: "var(--muted-2)" }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Vendors
      </Link>

      <div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>{vendor.name}</h1>
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{vendor.category}{vendor.primaryContact && ` · ${vendor.primaryContact}`}</p>
        {vendor.notes && <p className="mt-2 max-w-xl text-sm" style={{ color: "var(--muted-2)" }}>{vendor.notes}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Projects</h2>
          {vendor.projects.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-2)" }}>Not linked to any project.</p>
          ) : (
            vendor.projects.map(({ project }) => (
              <Link key={project.id} href={`/projects/${project.key}`} className="rounded-lg border px-3 py-2 text-sm hover:bg-[var(--surface-hover)]" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                {project.name}
              </Link>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Open tasks</h2>
          {vendor.tasks.length === 0 ? (
            <EmptyState title="Nothing open." />
          ) : (
            vendor.tasks.map((t) => <TaskRow key={t.id} task={t} />)
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Follow-ups</h2>
          {vendor.followUps.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-2)" }}>Nothing outstanding.</p>
          ) : (
            vendor.followUps.map((f) => (
              <div key={f.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                {f.topic} <span style={{ color: "var(--muted-2)" }}>· {dueLabel(f.followUpDate)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
