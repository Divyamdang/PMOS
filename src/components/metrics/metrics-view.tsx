"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/pmos/states";
import { createMetric } from "@/app/actions/metrics";
import { formatDate, formatNumber } from "@/lib/format";
import { toast } from "sonner";
import { Plus, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Metric, Project } from "@/generated/prisma";

type MetricRow = Metric & { project: Project | null };

export function MetricsView({ groups, projects }: { groups: [string, MetricRow[]][]; projects: Project[] }) {
  const [newOpen, setNewOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--muted-2)" }}>Success rates, volumes, cost — tracked over time.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" /> Log metric
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={LineChartIcon} title="No metrics logged yet." description="Track payment success rate, volume, cost per transaction — whatever matters." action={{ label: "Log metric", onClick: () => setNewOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map(([name, points]) => {
            const latest = points[points.length - 1];
            const chartData = points.map((p) => ({ date: formatDate(p.date, "MMM d"), value: p.value }));
            return (
              <div key={name} className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-lg" style={{ fontFamily: "var(--font-mono)" }}>
                    {formatNumber(latest.value)}{latest.unit}
                    {latest.target && <span className="ml-1.5 text-xs" style={{ color: "var(--muted-2)" }}>/ {latest.target}{latest.unit} target</span>}
                  </p>
                </div>
                {chartData.length > 1 && (
                  <div className="mt-2 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-2)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--muted-2)" }} axisLine={false} tickLine={false} width={32} domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ background: "var(--popover)", border: `1px solid var(--border-subtle)`, borderRadius: 8, fontSize: 12 }} />
                        <Line type="monotone" dataKey="value" stroke="var(--route)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NewMetricDialog open={newOpen} onOpenChange={setNewOpen} projects={projects} />
    </div>
  );
}

function NewMetricDialog({ open, onOpenChange, projects }: { open: boolean; onOpenChange: (open: boolean) => void; projects: Project[] }) {
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [projectId, setProjectId] = React.useState("none");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!name.trim() || !value) return;
    setSubmitting(true);
    try {
      await createMetric({ name: name.trim(), value: Number(value), unit: unit.trim() || undefined, target: target ? Number(target) : null, projectId: projectId === "none" ? null : projectId });
      toast.success("Metric logged.");
      onOpenChange(false);
      setName(""); setValue(""); setUnit(""); setTarget("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a metric</DialogTitle>
          <DialogDescription>Payment success rate, MDR, volume — whatever you&apos;re tracking.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Payment Success Rate" autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Value</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Target</Label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name.trim() || !value}>Log metric</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
