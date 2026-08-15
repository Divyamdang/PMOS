"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskRow } from "@/components/pmos/task-row";
import { EmptyState } from "@/components/pmos/states";
import { logInteraction } from "@/app/actions/people";
import { PERSON_CATEGORY_META } from "@/lib/domain";
import { timeAgo, dueLabel } from "@/lib/format";
import { toast } from "sonner";
import type { Person, Interaction, Task, FollowUp, Project } from "@/generated/prisma";

type PersonDetail = Person & {
  interactions: Interaction[];
  tasks: (Task & { project: Project | null })[];
  followUps: FollowUp[];
};

export function PersonProfile({ person }: { person: PersonDetail }) {
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submitNote() {
    if (!note.trim()) return;
    setSubmitting(true);
    await logInteraction(person.id, note.trim());
    setNote("");
    setSubmitting(false);
    toast.success("Logged.");
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/people" className="flex w-fit items-center gap-1 text-xs" style={{ color: "var(--muted-2)" }}>
        <ArrowLeft className="h-3.5 w-3.5" /> People
      </Link>

      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-lg">{person.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>{person.name}</h1>
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>
            {person.role}{person.company && ` · ${person.company}`} · {PERSON_CATEGORY_META[person.category].label}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Open work</h2>
          {person.tasks.length === 0 && person.followUps.length === 0 ? (
            <EmptyState title="Nothing open with them right now." />
          ) : (
            <div className="flex flex-col gap-2">
              {person.tasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
              {person.followUps.map((f) => (
                <div key={f.id} className="rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                  {f.topic} <span style={{ color: "var(--muted-2)" }}>· follow-up · {dueLabel(f.followUpDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Interaction timeline</h2>
          <div className="flex gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Log a conversation, decision, or update…"
              onKeyDown={(e) => e.key === "Enter" && submitNote()}
            />
            <Button size="sm" onClick={submitNote} disabled={submitting || !note.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {person.interactions.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted-2)" }}>No interactions logged yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {person.interactions.map((i) => (
                <div key={i.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                  <p>{i.note}</p>
                  <p className="text-[11px]" style={{ color: "var(--muted-2)" }}>{timeAgo(i.date)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
