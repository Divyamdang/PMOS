"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { aiSummarizeProject, checkAIEnabled } from "@/app/actions/ai";
import { Sparkles, Loader2 } from "lucide-react";

export function AISummaryCard({ projectId }: { projectId: string }) {
  const [enabled, setEnabled] = React.useState<boolean | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    checkAIEnabled().then(setEnabled);
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    const result = await aiSummarizeProject(projectId);
    setLoading(false);
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    setSummary(result.data);
  }

  if (enabled === false) return null; // don't clutter the cockpit when AI isn't configured

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--card)" }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--route)" }} /> AI Summary
        </p>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-xs" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {summary ? "Regenerate" : "Generate"}
        </Button>
      </div>
      {error && <p className="text-xs" style={{ color: "var(--coral)" }}>{error}</p>}
      {summary ? (
        <p className="text-sm leading-relaxed">{summary}</p>
      ) : (
        !error && <p className="text-sm" style={{ color: "var(--muted-2)" }}>Generate a plain-language read on where this project stands.</p>
      )}
    </div>
  );
}
