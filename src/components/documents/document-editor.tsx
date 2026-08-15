"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/documents/rich-text-editor";
import { updateDocument, deleteDocument, convertRequirementsToTasks } from "@/app/actions/documents";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Document, Project } from "@/generated/prisma";

const PRD_FIELDS: { key: keyof Document; label: string; placeholder: string }[] = [
  { key: "prdProblem", label: "Problem", placeholder: "What problem are we solving, and for whom?" },
  { key: "prdBackground", label: "Background", placeholder: "What's the context leading up to this?" },
  { key: "prdGoals", label: "Goals", placeholder: "What does success look like?" },
  { key: "prdNonGoals", label: "Non-goals", placeholder: "What are we explicitly not doing?" },
  { key: "prdUserStories", label: "User Stories", placeholder: "As a … I want … so that …" },
  { key: "prdRequirements", label: "Requirements", placeholder: "One requirement per line — these can convert to tasks below." },
  { key: "prdAcceptanceCriteria", label: "Acceptance Criteria", placeholder: "How do we know this is done?" },
  { key: "prdSuccessMetrics", label: "Success Metrics", placeholder: "What will we measure?" },
  { key: "prdRisks", label: "Risks", placeholder: "What could go wrong?" },
  { key: "prdDependencies", label: "Dependencies", placeholder: "What does this rely on?" },
  { key: "prdRolloutPlan", label: "Rollout Plan", placeholder: "How do we ship this safely?" },
];

export function DocumentEditor({ doc }: { doc: Document & { project: Project | null } }) {
  const router = useRouter();
  const [title, setTitle] = React.useState(doc.title);
  const [content, setContent] = React.useState(doc.content);
  const [fields, setFields] = React.useState<Record<string, string>>(
    Object.fromEntries(PRD_FIELDS.map((f) => [f.key, (doc[f.key] as string) ?? ""]))
  );
  const [converting, setConverting] = React.useState(false);

  function saveField(key: string, value: string) {
    updateDocument(doc.id, { [key]: value });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/documents" className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-2)" }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Documents
        </Link>
        <button
          className="flex items-center gap-1 text-xs hover:text-[var(--coral)]"
          style={{ color: "var(--muted-2)" }}
          onClick={async () => {
            await deleteDocument(doc.id);
            toast("Document deleted.");
            router.push("/documents");
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== doc.title && saveField("title", title)}
        className="border-none px-0 text-2xl font-medium shadow-none focus-visible:ring-0"
        style={{ fontFamily: "var(--font-display)" }}
      />
      {doc.project && <p className="text-xs" style={{ color: "var(--muted-2)" }}>{doc.project.name}</p>}

      {doc.type === "PRD" ? (
        <div className="flex flex-col gap-5">
          {PRD_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>{f.label}</label>
              <Textarea
                value={fields[f.key]}
                onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                onBlur={() => saveField(f.key, fields[f.key])}
                placeholder={f.placeholder}
                rows={f.key === "prdRequirements" ? 4 : 3}
              />
              {f.key === "prdRequirements" && fields[f.key]?.trim() && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit gap-1.5"
                  disabled={converting}
                  onClick={async () => {
                    setConverting(true);
                    const tasks = await convertRequirementsToTasks(doc.id);
                    setConverting(false);
                    toast.success(`Created ${tasks.length} task${tasks.length === 1 ? "" : "s"}.`);
                  }}
                >
                  Convert requirements to tasks <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <RichTextEditor content={content} onChange={(html) => { setContent(html); saveField("content", html); }} />
      )}
    </div>
  );
}
