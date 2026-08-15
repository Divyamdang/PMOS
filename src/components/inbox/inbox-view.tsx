"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/pmos/states";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { convertInboxItem, deleteInboxItem } from "@/app/actions/inbox";
import { AITaskDraftDialog } from "@/components/inbox/ai-task-draft-dialog";
import { useUIStore } from "@/lib/store/ui-store";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2, ChevronDown, CheckSquare, PhoneCall, Bell, Video, Search, Lightbulb } from "lucide-react";
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { InboxItem, InboxConversion } from "@/generated/prisma";

const CONVERSIONS: { value: InboxConversion; label: string; icon: typeof CheckSquare }[] = [
  { value: "TASK", label: "Task", icon: CheckSquare },
  { value: "FOLLOW_UP", label: "Follow-up", icon: PhoneCall },
  { value: "REMINDER", label: "Reminder", icon: Bell },
  { value: "MEETING", label: "Meeting", icon: Video },
  { value: "RESEARCH", label: "Research", icon: Search },
  { value: "IDEA", label: "Idea", icon: Lightbulb },
];

export function InboxView({
  items,
  projects,
  openCaptureOnLoad,
}: {
  items: InboxItem[];
  projects: { id: string; key: string; name: string }[];
  openCaptureOnLoad: boolean;
}) {
  const router = useRouter();
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen);
  const [aiDraftItem, setAiDraftItem] = React.useState<InboxItem | null>(null);

  React.useEffect(() => {
    if (openCaptureOnLoad) {
      setQuickCaptureOpen(true);
      router.replace("/inbox");
    }
  }, [openCaptureOnLoad, setQuickCaptureOpen, router]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>
          Raw capture, triaged on your terms. Sort each into something real, or leave it — nothing here is urgent by default.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setQuickCaptureOpen(true)}>
          <Plus className="h-4 w-4" /> Capture
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Sparkles} title="Inbox zero." description="Capture a raw thought any time with N or the + button — it'll land here first." />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
              <span className="min-w-0 flex-1 truncate">{item.text}</span>
              <span className="shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>{timeAgo(item.createdAt)}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                    Convert <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAiDraftItem(item)}>
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--route)" }} /> Draft task with AI
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {CONVERSIONS.map((c) => (
                    <DropdownMenuItem
                      key={c.value}
                      onClick={async () => {
                        const task = await convertInboxItem(item.id, c.value);
                        toast.success(`Converted to ${c.label.toLowerCase()}.`, { description: task.taskKey });
                      }}
                    >
                      <c.icon className="h-3.5 w-3.5" /> {c.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                className="shrink-0"
                style={{ color: "var(--muted-2)" }}
                onClick={async () => {
                  await deleteInboxItem(item.id);
                  toast("Discarded.");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {aiDraftItem && (
        <AITaskDraftDialog
          open={!!aiDraftItem}
          onOpenChange={(o) => !o && setAiDraftItem(null)}
          itemId={aiDraftItem.id}
          text={aiDraftItem.text}
          projects={projects}
        />
      )}
    </div>
  );
}
