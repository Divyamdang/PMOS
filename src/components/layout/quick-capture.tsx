"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/store/ui-store";
import { captureInboxItem } from "@/app/actions/inbox";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function QuickCapture() {
  const open = useUIStore((s) => s.quickCaptureOpen);
  const setOpen = useUIStore((s) => s.setQuickCaptureOpen);
  const [text, setText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    await captureInboxItem(text);
    setSubmitting(false);
    setText("");
    setOpen(false);
    toast.success("Captured to Inbox.", { description: "Triage it into a task, follow-up, or reminder whenever you're ready." });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--route)" }} />
            Quick capture
          </DialogTitle>
          <DialogDescription>
            Drop a raw thought — "Ask Rahul about UAT". Sort it into something real later from your Inbox.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          rows={3}
          placeholder="Follow up with Cashfree about API credentials Friday…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting || !text.trim()}>
            Capture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
