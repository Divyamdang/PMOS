"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createFollowUp } from "@/app/actions/follow-ups";
import { PRIORITY_META } from "@/lib/domain";
import { toast } from "sonner";
import type { Priority, FollowUpChannel, Person, Vendor, Project } from "@/generated/prisma";

const CHANNELS: FollowUpChannel[] = ["EMAIL", "PHONE", "WHATSAPP", "SLACK", "MEETING", "OTHER"];

export function NewFollowUpDialog({
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
  const [topic, setTopic] = React.useState("");
  const [contactType, setContactType] = React.useState<"person" | "vendor">("vendor");
  const [contactId, setContactId] = React.useState("");
  const [channel, setChannel] = React.useState<FollowUpChannel>("EMAIL");
  const [priority, setPriority] = React.useState<Priority>("P2");
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [projectId, setProjectId] = React.useState("none");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!topic.trim()) return;
    setSubmitting(true);
    try {
      await createFollowUp({
        topic: topic.trim(),
        personId: contactType === "person" ? contactId || null : null,
        vendorId: contactType === "vendor" ? contactId || null : null,
        channel,
        priority,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        relatedProjectId: projectId === "none" ? null : projectId,
        notes: notes.trim() || undefined,
      });
      toast.success("Follow-up created.");
      onOpenChange(false);
      setTopic("");
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  }

  const contacts = contactType === "person" ? people : vendors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New follow-up</DialogTitle>
          <DialogDescription>Who do you need to chase, and about what?</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="API credentials & go-live checklist" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>With</Label>
              <Select value={contactType} onValueChange={(v) => { setContactType(v as "person" | "vendor"); setContactId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as FollowUpChannel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Follow up on</Label>
              <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
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
          <div className="flex flex-col gap-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !topic.trim()}>Create follow-up</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
