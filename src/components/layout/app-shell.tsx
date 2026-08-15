"use client";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { QuickCapture } from "./quick-capture";
import { TaskDrawer } from "@/components/pmos/task-drawer";

type ShellUser = { name: string; email: string; image: string | null };

export function AppShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <CommandPalette />
      <KeyboardShortcuts />
      <QuickCapture />
      <TaskDrawer />
    </div>
  );
}
