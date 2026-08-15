"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { aiDraftActionItems } from "@/app/actions/ai";
import { addActionItem, convertActionItemToTask } from "@/app/actions/meetings";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import type { ActionItemDraft } from "@/lib/ai/service";
import type { ActionItem } from "@/generated/prisma";

export function AIActionItemsDialog({
  open,
  onOpenChange,
  meetingId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  onCreated: (items: ActionItem[]) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<(ActionItemDraft & { selected: boolean })[]>([]);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    aiDraftActionItems(meetingId).then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setDrafts(result.data.map((d) => ({ ...d, selected: true })));
    });
  }, [open, meetingId]);

  async function confirm() {
    setCreating(true);
    const created: ActionItem[] = [];
    for (const d of drafts.filter((d) => d.selected)) {
      const item = await addActionItem(meetingId, d.description, d.ownerName ?? undefined, d.dueDateIso ? new Date(d.dueDateIso) : null);
      await convertActionItemToTask(item.id);
      created.push(item);
    }
    setCreating(false);
    onOpenChange(false);
    onCreated(created);
    toast.success(`Created ${created.length} task${created.length === 1 ? "" : "s"} from notes.`);
  }

  const selectedCount = drafts.filter((d) => d.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--route)" }} /> Extract action items
          </DialogTitle>
          <DialogDescription>Pick which ones become tasks — nothing is created until you confirm.</DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm" style={{ color: "var(--muted-2)" }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Reading notes…
          </div>
        )}
        {error && <p className="text-sm" style={{ color: "var(--coral)" }}>{error}</p>}
        {!loading && !error && drafts.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>No clear action items found in these notes.</p>
        )}
        {drafts.length > 0 && (
          <div className="flex flex-col gap-2">
            {drafts.map((d, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border p-2.5" style={{ borderColor: "var(--border-subtle)" }}>
                <Checkbox
                  checked={d.selected}
                  onCheckedChange={(checked) => {
                    const next = [...drafts];
                    next[i] = { ...d, selected: !!checked };
                    setDrafts(next);
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Input
                    value={d.description}
                    onChange={(e) => {
                      const next = [...drafts];
                      next[i] = { ...d, description: e.target.value };
                      setDrafts(next);
                    }}
                    className="h-7 text-sm"
                  />
                  {d.ownerName && <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>{d.ownerName}{d.dueDateIso && ` · due ${d.dueDateIso}`}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm} disabled={selectedCount === 0 || creating}>
            {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create {selectedCount || ""} task{selectedCount === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
