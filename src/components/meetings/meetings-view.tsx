"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/pmos/states";
import { NewMeetingDialog } from "@/components/meetings/new-meeting-dialog";
import { AIActionItemsDialog } from "@/components/meetings/ai-action-items-dialog";
import { addActionItem, convertActionItemToTask } from "@/app/actions/meetings";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Video, ArrowRight, Check, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Meeting, MeetingParticipant, Person, ActionItem, Project } from "@/generated/prisma";

type MeetingRow = Meeting & { participants: (MeetingParticipant & { person: Person })[]; actionItems: ActionItem[]; project: Project | null };

export function MeetingsView({
  meetings,
  people,
  projects,
  openNewOnLoad,
}: {
  meetings: MeetingRow[];
  people: Person[];
  projects: Project[];
  openNewOnLoad: boolean;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = React.useState(openNewOnLoad);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>{meetings.length} meetings</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> New meeting
        </Button>
      </div>

      {meetings.length === 0 ? (
        <EmptyState icon={Video} title="Nothing on the books." description="Meetings you schedule — with notes and action items — will show up here." action={{ label: "New meeting", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      )}

      <NewMeetingDialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) router.replace("/meetings"); }} people={people} projects={projects} />
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingRow }) {
  const [newItem, setNewItem] = React.useState("");
  const [items, setItems] = React.useState(meeting.actionItems);
  const [aiOpen, setAiOpen] = React.useState(false);

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{meeting.title}</p>
          <p className="text-xs" style={{ color: "var(--muted-2)" }}>
            {formatDate(meeting.date, "EEE, MMM d 'at' h:mm a")}
            {meeting.project && (
              <>
                {" · "}
                <Link href={`/projects/${meeting.project.key}`} className="hover:underline">{meeting.project.name}</Link>
              </>
            )}
            {meeting.participants.length > 0 && ` · ${meeting.participants.map((p) => p.person.name).join(", ")}`}
          </p>
        </div>
      </div>
      {meeting.agenda && <p className="mt-2 text-sm" style={{ color: "var(--muted-2)" }}>{meeting.agenda}</p>}
      {meeting.notes && (
        <>
          <p className="mt-2 text-sm" style={{ color: "var(--muted-2)" }}>{meeting.notes}</p>
          <button
            className="mt-1.5 flex w-fit items-center gap-1.5 text-xs"
            style={{ color: "var(--route)" }}
            onClick={() => setAiOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" /> Extract action items with AI
          </button>
        </>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1">
              {item.description} {item.ownerName && <span style={{ color: "var(--muted-2)" }}>· {item.ownerName}</span>}
            </span>
            {item.convertedTaskId ? (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--settled)" }}>
                <Check className="h-3.5 w-3.5" /> Task created
              </span>
            ) : (
              <button
                className="flex shrink-0 items-center gap-1 text-xs"
                style={{ color: "var(--route)" }}
                onClick={async () => {
                  const task = await convertActionItemToTask(item.id);
                  setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, convertedTaskId: task.id } : i)));
                  toast.success("Converted to task.", { description: task.taskKey });
                }}
              >
                Convert to task <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an action item…"
            className="h-7 text-xs"
            onKeyDown={async (e) => {
              if (e.key === "Enter" && newItem.trim()) {
                const created = await addActionItem(meeting.id, newItem.trim());
                setItems((prev) => [...prev, created]);
                setNewItem("");
              }
            }}
          />
        </div>
      </div>

      <AIActionItemsDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        meetingId={meeting.id}
        onCreated={(created) => setItems((prev) => [...prev, ...created.map((c) => ({ ...c, convertedTaskId: c.id }))])}
      />
    </div>
  );
}
