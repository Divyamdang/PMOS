"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createWaitingForItem } from "@/app/actions/waiting-for";
import { toast } from "sonner";
import type { Person, Vendor, Project } from "@/generated/prisma";

export function NewWaitingForDialog({
  open,
  onOpenChange,
  people,
  vendors,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
  vendors: Vendor[];
  projects: Project[];
}) {
  const [who, setWho] = React.useState("");
  const [what, setWhat] = React.useState("");
  const [contactType, setContactType] = React.useState<"person" | "vendor" | "none">("none");
  const [contactId, setContactId] = React.useState("");
  const [projectId, setProjectId] = React.useState("none");
  const [expectedDate, setExpectedDate] = React.useState("");
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!who.trim() || !what.trim()) return;
    setSubmitting(true);
    try {
      await createWaitingForItem({
        who: who.trim(),
        what: what.trim(),
        personId: contactType === "person" ? contactId || null : null,
        vendorId: contactType === "vendor" ? contactId || null : null,
        projectId: projectId === "none" ? null : projectId,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      });
      toast.success("Added to Waiting For.");
      onOpenChange(false);
      setWho("");
      setWhat("");
    } finally {
      setSubmitting(false);
    }
  }

  const contacts = contactType === "person" ? people : contactType === "vendor" ? vendors : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Waiting for something?</DialogTitle>
          <DialogDescription>Track what you&apos;re blocked on until it lands.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Who</Label>
              <Input value={who} onChange={(e) => setWho(e.target.value)} placeholder="Finance" autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>What</Label>
              <Input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Settlement file" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Link to</Label>
              <Select value={contactType} onValueChange={(v) => { setContactType(v as typeof contactType); setContactId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nobody specific</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {contactType !== "none" && (
              <div className="flex flex-col gap-1.5">
                <Label>&nbsp;</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Expected</Label>
              <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Follow up on</Label>
              <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !who.trim() || !what.trim()}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
