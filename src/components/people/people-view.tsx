"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/pmos/states";
import { NewPersonDialog } from "@/components/people/new-person-dialog";
import { PERSON_CATEGORY_META } from "@/lib/domain";
import { daysSince } from "@/lib/format";
import { Plus, Users } from "lucide-react";
import type { Person } from "@/generated/prisma";

type PersonRow = Person & { _count: { tasks: number; followUps: number } };

export function PeopleView({ people }: { people: PersonRow[] }) {
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{people.length} people</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New person
        </Button>
      </div>

      {people.length === 0 ? (
        <EmptyState icon={Users} title="Nobody here yet." description="Add the people you work with to track follow-ups and interactions." action={{ label: "New person", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-[var(--route)]"
              style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}
            >
              <Avatar>
                <AvatarFallback>{p.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-xs" style={{ color: "var(--muted-2)" }}>{p.role}{p.company && ` · ${p.company}`}</p>
                <p className="mt-1 text-[11px]" style={{ color: "var(--muted-2)" }}>
                  {PERSON_CATEGORY_META[p.category].label}
                  {p.lastInteraction && ` · last contact ${daysSince(p.lastInteraction)}d ago`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewPersonDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}
