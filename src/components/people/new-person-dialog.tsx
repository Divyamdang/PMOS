"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPerson } from "@/app/actions/people";
import { PERSON_CATEGORY_META } from "@/lib/domain";
import { toast } from "sonner";
import type { PersonCategory } from "@/generated/prisma";

export function NewPersonDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [category, setCategory] = React.useState<PersonCategory>("OTHER");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createPerson({ name: name.trim(), role: role.trim() || undefined, company: company.trim() || undefined, email: email.trim() || undefined, category });
      toast.success("Person added.");
      onOpenChange(false);
      setName(""); setRole(""); setCompany(""); setEmail("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New person</DialogTitle>
          <DialogDescription>Someone you&apos;ll be working with.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Engineering Lead" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PersonCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PERSON_CATEGORY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Company</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name.trim()}>Add person</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
