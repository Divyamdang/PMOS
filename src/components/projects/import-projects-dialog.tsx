"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadBase64File } from "@/lib/download-file";
import {
  generateImportTemplate,
  previewImport,
  commitImport,
  type ImportPreview,
} from "@/app/actions/import-projects";
import { Download, Upload, FileSpreadsheet, AlertTriangle, Info } from "lucide-react";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Bulk project/task import. Follows the same shape as the AI features: parse
 * and validate first, show exactly what would happen, and write nothing until
 * it's confirmed. */
export function ImportProjectsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [busy, setBusy] = React.useState<"template" | "parsing" | "importing" | null>(null);

  function reset() {
    setFileName(null);
    setPreview(null);
    setBusy(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleTemplate() {
    setBusy("template");
    try {
      downloadBase64File(await generateImportTemplate(), "wts-import-template.xlsx", XLSX_MIME);
    } catch {
      toast.error("Couldn't build the template. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleFile(file: File) {
    setBusy("parsing");
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      setPreview(await previewImport(btoa(binary), file.name));
    } catch {
      toast.error("Couldn't read that file. Download the template and fill that in.");
      reset();
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirm() {
    if (!preview?.payload) return;
    setBusy("importing");
    try {
      const result = await commitImport(preview.payload);
      const bits = [
        result.projectsCreated && `${result.projectsCreated} project${result.projectsCreated === 1 ? "" : "s"} created`,
        result.projectsUpdated && `${result.projectsUpdated} updated`,
        result.tasksCreated && `${result.tasksCreated} task${result.tasksCreated === 1 ? "" : "s"} added`,
      ].filter(Boolean) as string[];

      const warnings = result.issues.filter((i) => !i.blocking).length;
      toast.success(bits.length ? bits.join(" · ") : "Nothing new to import.", {
        description: warnings ? `${warnings} row${warnings === 1 ? "" : "s"} needed a fallback — see the summary.` : undefined,
      });
      onOpenChange(false);
      reset();
      router.refresh();
    } catch {
      toast.error("The import failed and nothing was saved. Check the file and try again.");
      setBusy(null);
    }
  }

  const blocking = preview?.issues.filter((i) => i.blocking) ?? [];
  const warnings = preview?.issues.filter((i) => !i.blocking) ?? [];
  const nothingToDo =
    preview && !preview.fatal &&
    preview.projectsToCreate.length === 0 &&
    preview.projectsToUpdate.length === 0 &&
    preview.tasksToCreate === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import from Excel</DialogTitle>
          <DialogDescription>
            Bring projects and their tasks in from a spreadsheet. Nothing is saved until you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleTemplate} disabled={busy !== null}>
              <Download className="h-3.5 w-3.5" />
              {busy === "template" ? "Building…" : "Download template"}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileInput.current?.click()} disabled={busy !== null}>
              <Upload className="h-3.5 w-3.5" />
              {busy === "parsing" ? "Reading…" : "Choose file"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {fileName && (
            <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-2)" }}>
              <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName}
            </p>
          )}

          {preview?.fatal && (
            <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: "var(--coral)", background: "var(--coral-soft)" }}>
              {preview.fatal}
            </div>
          )}

          {preview && !preview.fatal && (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--graphite)" }}>
                {nothingToDo ? (
                  <p className="text-sm" style={{ color: "var(--muted-2)" }}>
                    Everything in this file is already in WTS. Importing again would change nothing.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm">
                    <SummaryLine n={preview.projectsToCreate.length} label="project" verb="to create" />
                    <SummaryLine n={preview.projectsToUpdate.length} label="project" verb="to update" />
                    <SummaryLine n={preview.tasksToCreate} label="task" verb="to add" />
                    {preview.tasksSkippedExisting > 0 && (
                      <li style={{ color: "var(--muted-2)" }}>
                        {preview.tasksSkippedExisting} task{preview.tasksSkippedExisting === 1 ? "" : "s"} already exist — left untouched
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {(blocking.length > 0 || warnings.length > 0) && (
                <div className="max-h-48 overflow-y-auto rounded-lg border" style={{ borderColor: "var(--border-subtle)" }}>
                  {blocking.map((i, n) => (
                    <IssueRow key={`b${n}`} icon={AlertTriangle} color="var(--coral)" issue={i} />
                  ))}
                  {warnings.map((i, n) => (
                    <IssueRow key={`w${n}`} icon={Info} color="var(--amber)" issue={i} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy === "importing"}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!preview || !!preview.fatal || !!nothingToDo || busy !== null}
          >
            {busy === "importing" ? "Importing…" : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryLine({ n, label, verb }: { n: number; label: string; verb: string }) {
  if (n === 0) return null;
  return (
    <li>
      <span style={{ fontFamily: "var(--font-mono)" }}>{n}</span> {label}
      {n === 1 ? "" : "s"} {verb}
    </li>
  );
}

function IssueRow({
  icon: Icon,
  color,
  issue,
}: {
  icon: typeof Info;
  color: string;
  issue: { sheet: string; row: number; message: string };
}) {
  return (
    <div className="flex items-start gap-2 border-b px-3 py-2 text-xs last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color }} />
      <p>
        <span style={{ color: "var(--muted-2)" }}>
          {issue.sheet} row {issue.row} —{" "}
        </span>
        {issue.message}
      </p>
    </div>
  );
}
