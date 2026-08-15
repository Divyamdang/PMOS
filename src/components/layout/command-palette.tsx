"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/lib/store/ui-store";
import { NAV_GROUPS, SETTINGS_ITEM } from "./nav-config";
import { searchEverything, type SearchResults } from "@/app/actions/search";
import { aiSearch } from "@/app/actions/ai";
import { Plus, AlertTriangle, Ban, Clock3, Sparkles } from "lucide-react";

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const openTaskDrawer = useUIStore((s) => s.openTaskDrawer);
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResults | null>(null);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const handle = setTimeout(() => {
      searchEverything(query).then(setResults);
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  async function askAI() {
    const q = query.trim();
    if (!q) return;
    const result = await aiSearch(q);
    setOpen(false);
    if (!result.ok) {
      router.push(`/tasks?q=${encodeURIComponent(q)}`);
      return;
    }
    const params = new URLSearchParams();
    if (result.data.statusFilter && result.data.statusFilter !== "all") params.set("filter", result.data.statusFilter);
    const text = [result.data.textKeyword, result.data.assigneeKeyword].filter(Boolean).join(" ");
    if (text) params.set("q", text);
    router.push(`/tasks?${params.toString()}`);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command Palette" description="Jump anywhere or create something new">
      <CommandInput placeholder="Search PMOS, or type a command…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results. Try "task", "project", or a person's name.</CommandEmpty>

        {query.trim().length >= 3 && (
          <>
            <CommandGroup heading="Ask AI">
              <CommandItem onSelect={askAI}>
                <Sparkles style={{ color: "var(--route)" }} />
                Ask AI: "{query.trim()}"
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {results && (
          <>
            {results.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.tasks.map((t) => (
                  <CommandItem key={t.id} onSelect={() => { setOpen(false); openTaskDrawer(t.id); }}>
                    {t.taskKey} {t.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.projects.length > 0 && (
              <CommandGroup heading="Projects">
                {results.projects.map((p) => (
                  <CommandItem key={p.id} onSelect={() => go(`/projects/${p.key}`)}>
                    {p.key} · {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.people.length > 0 && (
              <CommandGroup heading="People">
                {results.people.map((p) => (
                  <CommandItem key={p.id} onSelect={() => go(`/people/${p.id}`)}>
                    {p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.vendors.length > 0 && (
              <CommandGroup heading="Vendors">
                {results.vendors.map((v) => (
                  <CommandItem key={v.id} onSelect={() => go(`/vendors/${v.id}`)}>
                    {v.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.documents.length > 0 && (
              <CommandGroup heading="Documents">
                {results.documents.map((d) => (
                  <CommandItem key={d.id} onSelect={() => go(`/documents/${d.id}`)}>
                    {d.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {(results.meetings.length > 0 || results.decisions.length > 0 || results.risks.length > 0) && (
              <CommandGroup heading="More">
                {results.meetings.map((m) => (
                  <CommandItem key={m.id} onSelect={() => go("/meetings")}>
                    {m.title} <CommandShortcut>Meeting</CommandShortcut>
                  </CommandItem>
                ))}
                {results.decisions.map((d) => (
                  <CommandItem key={d.id} onSelect={() => go("/decisions")}>
                    {d.decision} <CommandShortcut>Decision</CommandShortcut>
                  </CommandItem>
                ))}
                {results.risks.map((r) => (
                  <CommandItem key={r.id} onSelect={() => go("/risks")}>
                    {r.risk} <CommandShortcut>Risk</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Create">
          <CommandItem onSelect={() => go("/tasks?new=1")}>
            <Plus /> New task
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/projects?new=1")}>
            <Plus /> New project
          </CommandItem>
          <CommandItem onSelect={() => go("/follow-ups?new=1")}>
            <Plus /> New follow-up
          </CommandItem>
          <CommandItem onSelect={() => go("/meetings?new=1")}>
            <Plus /> New meeting
          </CommandItem>
          <CommandItem onSelect={() => go("/risks?new=1")}>
            <Plus /> New risk
          </CommandItem>
          <CommandItem onSelect={() => go("/decisions?new=1")}>
            <Plus /> New decision
          </CommandItem>
          <CommandItem onSelect={() => go("/inbox?capture=1")}>
            <Sparkles /> Quick capture
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Show me">
          <CommandItem onSelect={() => go("/tasks?filter=overdue")}>
            <AlertTriangle /> Overdue work
          </CommandItem>
          <CommandItem onSelect={() => go("/tasks?filter=blocked")}>
            <Ban /> Blocked work
          </CommandItem>
          <CommandItem onSelect={() => go("/waiting-for")}>
            <Clock3 /> Waiting for
          </CommandItem>
          <CommandItem onSelect={() => go("/tasks?filter=today")}>
            <Clock3 /> Due today
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {NAV_GROUPS.flatMap((g) => g.items)
            .concat(SETTINGS_ITEM)
            .map((item) => (
              <CommandItem key={item.href} onSelect={() => go(item.href)}>
                <item.icon />
                {item.label}
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
