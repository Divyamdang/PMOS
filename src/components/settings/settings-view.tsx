"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { updatePreferences } from "@/app/actions/settings";
import { exportAllDataJson, exportTasksCsv } from "@/app/actions/data";
import { exportTasksToExcel } from "@/app/actions/export-excel";
import { downloadBase64File, downloadTextFile } from "@/lib/download-file";
import { signOutAction } from "@/app/actions/auth";
import { toast } from "sonner";
import { Download, Sparkles, FileSpreadsheet, LogOut } from "lucide-react";
import type { User, UserPreferences } from "@/generated/prisma";

type Counts = { projects: number; tasks: number; people: number; vendors: number };

export function SettingsView({
  preferences,
  user,
  counts,
  aiKeyConfigured,
}: {
  preferences: UserPreferences;
  user: User;
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
          <GeneralTab preferences={preferences} user={user} />
        </TabsContent>

        <TabsContent value="workspace" className="flex flex-col gap-3 pt-5">
          <p className="text-sm" style={{ color: "var(--muted-2)" }}>What&apos;s in your team&apos;s workspace right now.</p>
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
          <DataTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralTab({ preferences, user }: { preferences: UserPreferences; user: User }) {
  const [workingHoursStart, setWorkingHoursStart] = React.useState(preferences.workingHoursStart);
  const [workingHoursEnd, setWorkingHoursEnd] = React.useState(preferences.workingHoursEnd);
  const { theme, setTheme } = useTheme();
  // next-themes only knows the real theme after mount (it reads localStorage
  // client-side) — rendering theme-dependent UI before that mismatches SSR.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          {user.image && <AvatarImage src={user.image} alt={user.name} />}
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs" style={{ color: "var(--muted-2)" }}>{user.email}</p>
        </div>
      </div>
      <p className="text-xs" style={{ color: "var(--muted-2)" }}>
        Your name and picture come from your Google account. To change them, update your Google profile.
      </p>

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
          <Input type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} onBlur={() => updatePreferences({ workingHoursStart })} className="w-32" />
          <span style={{ color: "var(--muted-2)" }}>to</span>
          <Input type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} onBlur={() => updatePreferences({ workingHoursEnd })} className="w-32" />
        </div>
      </div>

      <form action={signOutAction}>
        <Button type="submit" size="sm" variant="outline" className="w-fit gap-1.5">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </form>
    </>
  );
}

function DataTab() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Export</p>
      <p className="text-xs" style={{ color: "var(--muted-2)" }}>
        Database backups are handled by Supabase — these are point-in-time exports for spreadsheets, reporting, or migrating elsewhere.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={async () => {
            const json = await exportAllDataJson();
            downloadTextFile(json, `wts-export-${new Date().toISOString().slice(0, 10)}.json`, "application/json");
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
            downloadTextFile(csv, `wts-tasks-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
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
  );
}
