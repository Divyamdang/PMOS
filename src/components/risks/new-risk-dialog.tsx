"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createRisk } from "@/app/actions/risks";
import { toast } from "sonner";

export function NewRiskDialog({ open, onOpenChange, defaultProjectId }: { open: boolean; onOpenChange: (open: boolean) => void; defaultProjectId?: string }) {
  const [risk, setRisk] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mitigation, setMitigation] = React.useState("");
  const [probability, setProbability] = React.useState(3);
  const [impact, setImpact] = React.useState(3);
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!risk.trim()) return;
    setSubmitting(true);
    try {
      await createRisk({ risk: risk.trim(), description: description.trim() || undefined, mitigation: mitigation.trim() || undefined, probability, impact, projectId: defaultProjectId });
      toast.success("Risk logged.");
      onOpenChange(false);
      setRisk("");
      setDescription("");
      setMitigation("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a risk</DialogTitle>
          <DialogDescription>Name what could go wrong while it's still manageable.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Risk</Label>
            <Input value={risk} onChange={(e) => setRisk(e.target.value)} placeholder="Vendor API delivery may slip" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Probability ({probability}/5)</Label>
              <Input type="range" min={1} max={5} value={probability} onChange={(e) => setProbability(Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Impact ({impact}/5)</Label>
              <Input type="range" min={1} max={5} value={impact} onChange={(e) => setImpact(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Mitigation</Label>
            <Textarea value={mitigation} onChange={(e) => setMitigation(e.target.value)} rows={2} placeholder="What's the plan if this happens?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !risk.trim()}>Log risk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
