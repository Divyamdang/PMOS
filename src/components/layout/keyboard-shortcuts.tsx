"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store/ui-store";

const KEY_ROUTES: Record<string, string> = {
  d: "/dashboard",
  p: "/projects",
  f: "/follow-ups",
  w: "/waiting-for",
};

/** Global shortcuts per master prompt Section 8: C, P, D, F, W, /, N,
 * Cmd/Ctrl+K, Esc. Ignored while typing in an input/textarea/contenteditable. */
export function KeyboardShortcuts() {
  const router = useRouter();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setQuickCaptureOpen = useUIStore((s) => s.setQuickCaptureOpen);

  React.useEffect(() => {
    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable || !!el.closest('[role="dialog"]');
    }

    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }
      if (e.key === "Escape") return; // handled by radix dialogs themselves

      if (isTyping(e.target) || mod) return;

      switch (e.key.toLowerCase()) {
        case "/":
          e.preventDefault();
          setCommandPaletteOpen(true);
          break;
        case "n":
          e.preventDefault();
          setQuickCaptureOpen(true);
          break;
        case "c":
          e.preventDefault();
          router.push("/tasks?new=1");
          break;
        case "d":
        case "p":
        case "f":
        case "w":
          e.preventDefault();
          router.push(KEY_ROUTES[e.key.toLowerCase()]);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, commandPaletteOpen, setCommandPaletteOpen, setQuickCaptureOpen]);

  return null;
}
