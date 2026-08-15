"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createDecision } from "@/app/actions/decisions";
import { toast } from "sonner";

export function NewDecisionDialog({ open, onOpenChange, defaultProjectId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultProjectId?: string }) {
  const [decision, setDecision] = React.useState("");
  const [context, setContext] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!decision.trim()) return;
    setSubmitting(true);
    try {
      await createDecision({ decision: decision.trim(), context: context.trim() || undefined, reason: reason.trim() || undefined, projectId: defaultProjectId });
      toast.success("Decision recorded.");
      onOpenChange(false);
      setDecision("");
      setContext("");
      setReason("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a decision</DialogTitle>
          <DialogDescription>Future-you will thank you for writing down the why.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Decision</Label>
            <Input value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Use rule-based routing for v1" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Context</Label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} placeholder="What situation led to this?" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why this over the alternatives?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !decision.trim()}>Record decision</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
