"use client";

import * as React from "react";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { aiWeeklyUpdate, aiWhatAmIForgetting } from "@/app/actions/ai";
import { toast } from "sonner";
import { Sparkles, ChevronDown, Loader2, Copy } from "lucide-react";

export function AIToolsMenu() {
  const [weeklyOpen, setWeeklyOpen] = React.useState(false);
  const [forgettingOpen, setForgettingOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--route)" }} />
            AI tools
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setWeeklyOpen(true)}>Weekly stakeholder update</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setForgettingOpen(true)}>What am I forgetting?</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WeeklyUpdateDialog open={weeklyOpen} onOpenChange={setWeeklyOpen} />
      <ForgettingDialog open={forgettingOpen} onOpenChange={setForgettingOpen} />
    </>
  );
}

function WeeklyUpdateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [text, setText] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    aiWeeklyUpdate().then((result) => {
      setLoading(false);
      if (!result.ok) setError(result.reason);
      else setText(result.data);
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--route)" }} /> Weekly stakeholder update
          </DialogTitle>
          <DialogDescription>Drafted from this week's activity — edit before sending.</DialogDescription>
        </DialogHeader>
        {loading && <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--muted-2)" }} />}
        {error && <p className="text-sm" style={{ color: "var(--coral)" }}>{error}</p>}
        {text && (
          <>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg border p-3 text-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-hover)", fontFamily: "var(--font-body)" }}>
              {text}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="w-fit gap-1.5"
              onClick={() => {
                navigator.clipboard.writeText(text);
                toast.success("Copied to clipboard.");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ForgettingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{ synthesis: string | null; items: { label: string; href: string }[] } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    aiWhatAmIForgetting().then((result) => {
      setLoading(false);
      if (result.ok) setData(result.data);
    });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "var(--route)" }} /> What am I forgetting?
          </DialogTitle>
          <DialogDescription>A scan across everything that might need you.</DialogDescription>
        </DialogHeader>
        {loading && <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--muted-2)" }} />}
        {data && (
          <div className="flex flex-col gap-3">
            {data.synthesis ? (
              <p className="text-sm leading-relaxed">{data.synthesis}</p>
            ) : (
              data.items.length > 0 && (
                <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                  AI narrative unavailable — here's the raw scan.
                </p>
              )
            )}
            {data.items.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--settled)" }}>Nothing's slipping. You're on top of it.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {data.items.map((item, i) => (
                  <Link key={i} href={item.href} onClick={() => onOpenChange(false)} className="rounded-md px-2 py-1.5 text-sm hover:bg-[var(--surface-hover)]">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
