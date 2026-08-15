"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { updateSettings } from "@/app/actions/settings";
import { exportAllDataJson, exportTasksCsv, createBackup, restoreBackup } from "@/app/actions/data";
import { exportTasksToExcel } from "@/app/actions/export-excel";
import { downloadBase64File } from "@/lib/download-file";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Download, Database, Sparkles, RotateCcw, FileSpreadsheet } from "lucide-react";
import type { Settings } from "@/generated/prisma";

type Backup = { fileName: string; size: number; createdAt: string };
type Counts = { projects: number; tasks: number; people: number; vendors: number };

export function SettingsView({
  settings,
  backups,
  counts,
  aiKeyConfigured,
}: {
  settings: Settings;
  backups: Backup[];
  counts: Counts;
  aiKeyConfigured: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-5 pt-5">
          <GeneralTab settings={settings} />
        </TabsContent>

        <TabsContent value="workspace" className="flex flex-col gap-3 pt-5">
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>What&apos;s in your workspace right now.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <p className="text-xs capitalize" style={{ color: "var(--muted-2)" }}>{k}</p>
                <p className="text-xl" style={{ fontFamily: "var(--font-mono)" }}>{v}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="flex flex-col gap-4 pt-5">
          <div className="flex items-center gap-2 rounded-lg border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
            <Sparkles className="h-4 w-4" style={{ color: aiKeyConfigured ? "var(--settled)" : "var(--muted-2)" }} />
            <div className="flex-1">
              <p className="text-sm font-medium">{aiKeyConfigured ? "AI is available" : "AI is unavailable"}</p>
              <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                {aiKeyConfigured
                  ? "OPENAI_API_KEY is configured. AI features work throughout WTS."
                  : "Set OPENAI_API_KEY in your environment to enable AI features. Everything else in WTS works without it."}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="flex flex-col gap-5 pt-5">
          <DataTab backups={backups} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralTab({ settings }: { settings: Settings }) {
  const [userName, setUserName] = React.useState(settings.userName);
  const [workingHoursStart, setWorkingHoursStart] = React.useState(settings.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = React.useState(settings.workingHoursEnd);
  const { theme, setTheme } = useTheme();
  // next-themes only knows the real theme after mount (it reads localStorage
  // client-side) — rendering theme-dependent UI before that mismatches SSR.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>Name</Label>
        <Input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          onBlur={() => userName !== settings.userName && updateSettings({ userName })}
          className="max-w-xs"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Theme</Label>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <Button key={t} size="sm" variant={mounted && theme === t ? "default" : "outline"} onClick={() => setTheme(t)} className="capitalize">
              {t}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Working hours</Label>
        <div className="flex items-center gap-2">
          <Input type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} onBlur={() => updateSettings({ workingHoursStart })} className="w-32" />
          <span style={{ color: "var(--muted-2)" }}>to</span>
          <Input type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} onBlur={() => updateSettings({ workingHoursEnd })} className="w-32" />
        </div>
      </div>
    </>
  );
}

function DataTab({ backups }: { backups: Backup[] }) {
  const [creating, setCreating] = React.useState(false);
  const [restoring, setRestoring] = React.useState<string | null>(null);

  function download(content: string, fileName: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Export</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={async () => {
              const json = await exportAllDataJson();
              download(json, `wts-export-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
            }}
          >
            <Download className="h-3.5 w-3.5" /> Export JSON
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={async () => {
              const csv = await exportTasksCsv();
              download(csv, `wts-tasks-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
            }}
          >
            <Download className="h-3.5 w-3.5" /> Export tasks CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={async () => {
              const base64 = await exportTasksToExcel();
              downloadBase64File(base64, `wts-tasks-${new Date().toISOString().slice(0, 10)}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
              toast.success("Exported to Excel.");
            }}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export tasks Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Backup & restore</p>
        <p className="text-xs" style={{ color: "var(--muted-2)" }}>Backs up the local database file. Restoring overwrites current data — a safety copy of the current state is made automatically first. Restart WTS after restoring.</p>
        <Button
          size="sm"
          variant="outline"
          className="w-fit gap-1.5"
          disabled={creating}
          onClick={async () => {
            setCreating(true);
            await createBackup();
            toast.success("Backup created.");
            setCreating(false);
            window.location.reload();
          }}
        >
          <Database className="h-3.5 w-3.5" /> Create backup now
        </Button>
        {backups.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {backups.map((b) => (
              <div key={b.fileName} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
                <span>{b.fileName}</span>
                <div className="flex items-center gap-3">
                  <span style={{ color: "var(--muted-2)" }}>{formatDate(b.createdAt, "MMM d, h:mm a")} · {(b.size / 1024).toFixed(0)}KB</span>
                  <button
                    disabled={restoring === b.fileName}
                    className="flex items-center gap-1"
                    style={{ color: "var(--route)" }}
                    onClick={async () => {
                      setRestoring(b.fileName);
                      await restoreBackup(b.fileName);
                      toast.success("Restored. Restart WTS to fully reload.");
                      setRestoring(null);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
