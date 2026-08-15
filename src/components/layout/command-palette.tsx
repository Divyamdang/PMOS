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
import { Plus, AlertTriangle, Ban, Clock3, Sparkles } from "lucide-react";

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command Palette" description="Jump anywhere or create something new">
      <CommandInput placeholder="Search PMOS, or type a command…" />
      <CommandList>
        <CommandEmpty>No results. Try “task”, “project”, or a person's name.</CommandEmpty>
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
