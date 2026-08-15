"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/pmos/states";
import { NewVendorDialog } from "@/components/vendors/new-vendor-dialog";
import { Plus, Building2 } from "lucide-react";
import type { Vendor } from "@/generated/prisma";

type VendorRow = Vendor & { _count: { projects: number; followUps: number } };

const STATUS_COLOR: Record<string, string> = { ACTIVE: "var(--settled)", EVALUATING: "var(--amber)", INACTIVE: "var(--muted-2)" };

export function VendorsView({ vendors }: { vendors: VendorRow[] }) {
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{vendors.length} vendors</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New vendor
        </Button>
      </div>

      {vendors.length === 0 ? (
        <EmptyState icon={Building2} title="No vendors yet." description="Gateways, banks, and partners you work with will show up here." action={{ label: "New vendor", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <Link
              key={v.id}
              href={`/vendors/${v.id}`}
              className="flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-[var(--route)]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{v.name}</p>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: STATUS_COLOR[v.status] }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[v.status] }} />
                  {v.status.charAt(0) + v.status.slice(1).toLowerCase()}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--muted-2)" }}>{v.category}</p>
              <p className="text-[11px]" style={{ color: "var(--muted-2)" }}>{v._count.projects} projects · {v._count.followUps} follow-ups</p>
            </Link>
          ))}
        </div>
      )}

      <NewVendorDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
