"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchGoogleCalendarEvents, importGoogleEvent } from "@/app/actions/meetings";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { CalendarDays, Loader2 } from "lucide-react";
import type { GoogleCalendarEvent } from "@/lib/google/calendar";
import type { Project } from "@/generated/prisma";

export function GoogleCalendarSyncDialog({
  open,
  onOpenChange,
  projects,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onImported: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<GoogleCalendarEvent[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [projectId, setProjectId] = React.useState<string>("none");
  const [importing, setImporting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetchGoogleCalendarEvents().then((result) => {
      setLoading(false);
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setEvents(result.events);
      setSelected(new Set(result.events.map((e) => e.id)));
    });
  }, [open]);

  async function confirm() {
    setImporting(true);
    let count = 0;
    for (const event of events) {
      if (!selected.has(event.id)) continue;
      await importGoogleEvent(event, projectId === "none" ? null : projectId);
      count++;
    }
    setImporting(false);
    onOpenChange(false);
    onImported();
    toast.success(`Imported ${count} meeting${count === 1 ? "" : "s"} from Google Calendar.`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" style={{ color: "var(--route)" }} /> Sync Google Calendar
          </DialogTitle>
          <DialogDescription>Pick which upcoming events become meetings here.</DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm" style={{ color: "var(--muted-2)" }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Reading your calendar…
          </div>
        )}
        {error && <p className="text-sm" style={{ color: "var(--coral)" }}>{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>Nothing new on your calendar to import.</p>
        )}
        {events.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
              {events.map((event) => (
                <label key={event.id} className="flex items-start gap-2 rounded-lg border p-2.5" style={{ borderColor: "var(--border-subtle)" }}>
                  <Checkbox
                    checked={selected.has(event.id)}
                    onCheckedChange={(checked) => {
                      const next = new Set(selected);
                      if (checked) next.add(event.id);
                      else next.delete(event.id);
                      setSelected(next);
                    }}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{event.title}</p>
                    {event.start && <p className="text-xs" style={{ color: "var(--muted-2)" }}>{formatDate(event.start, "EEE, MMM d 'at' h:mm a")}</p>}
                  </div>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>Link imported meetings to a project (optional)</label>
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
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirm} disabled={selected.size === 0 || importing}>
            {importing && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Import {selected.size || ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
