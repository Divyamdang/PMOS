"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createVendor } from "@/app/actions/vendors";
import { toast } from "sonner";

export function NewVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [primaryContact, setPrimaryContact] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createVendor({ name: name.trim(), category: category.trim() || undefined, primaryContact: primaryContact.trim() || undefined, website: website.trim() || undefined });
      toast.success("Vendor added.");
      onOpenChange(false);
      setName(""); setCategory(""); setPrimaryContact(""); setWebsite("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New vendor</DialogTitle>
          <DialogDescription>A gateway, bank, or partner you work with.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cashfree" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Payment Gateway" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Primary contact</Label>
              <Input value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name.trim()}>Add vendor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
