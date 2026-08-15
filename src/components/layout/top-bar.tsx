"use client";

import { usePathname } from "next/navigation";
import { Search, Plus, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS, SETTINGS_ITEM } from "./nav-config";
import { useUIStore } from "@/lib/store/ui-store";
import { NotificationBell } from "./notification-bell";

function useSectionTitle() {
  const pathname = usePathname();
  const all = NAV_GROUPS.flatMap((g) => g.items).concat(SETTINGS_ITEM);
  const match = all.find((item) => pathname === item.href || pathname?.startsWith(item.href + "/"));
  return match?.label ?? "PMOS";
}

export function TopBar() {
  const title = useSectionTitle();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <h1 className="text-sm font-medium" style={{ color: "var(--muted-2)" }}>
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-sm text-muted-foreground sm:flex"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          Search
          <kbd className="ml-2 rounded border px-1 text-[10px]" style={{ borderColor: "var(--border-subtle)", fontFamily: "var(--font-mono)" }}>
            ⌘K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setCommandPaletteOpen(true)} className="sm:hidden">
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 scale-100 dark:scale-0 transition-transform" />
          <Moon className="absolute h-4 w-4 scale-0 dark:scale-100 transition-transform" />
        </Button>
        <NotificationBell />
        <Button size="sm" className="gap-1.5" onClick={() => setQuickCaptureOpen(true)}>
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>
    </header>
  );
}
