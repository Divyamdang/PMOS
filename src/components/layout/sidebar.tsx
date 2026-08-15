"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS, SETTINGS_ITEM } from "./nav-config";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r px-3 py-4 lg:flex"
      style={{ borderColor: "var(--border-subtle)", background: "var(--graphite)" }}
    >
      <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold"
          style={{ background: "var(--route)", color: "var(--primary-foreground)", fontFamily: "var(--font-mono)" }}
        >
          P
        </span>
        <span className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          PMOS
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active ? "font-medium" : "hover:bg-[var(--surface-hover)]"
                  )}
                  style={{
                    background: active ? "var(--route-soft)" : undefined,
                    color: active ? "var(--route)" : "var(--foreground)",
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "var(--route)" : "var(--muted-2)" }} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.shortcut && (
                    <kbd
                      className="rounded border px-1 text-[10px] opacity-0 group-hover:opacity-100"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--muted-2)", fontFamily: "var(--font-mono)" }}
                    >
                      {item.shortcut}
                    </kbd>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-0.5 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
        <Link
          href={SETTINGS_ITEM.href}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
          )}
          style={{ color: pathname?.startsWith("/settings") ? "var(--route)" : "var(--foreground)" }}
        >
          <SETTINGS_ITEM.icon className="h-4 w-4" style={{ color: "var(--muted-2)" }} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
