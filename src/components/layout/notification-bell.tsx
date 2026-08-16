"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, Ban, PhoneCall, Video, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchNotifications } from "@/app/actions/notifications";
import { useUIStore } from "@/lib/store/ui-store";
import type { NotificationsData } from "@/lib/queries/notifications";

export function NotificationBell({ initialData }: { initialData: NotificationsData }) {
  const router = useRouter();
  const openTaskDrawer = useUIStore((s) => s.openTaskDrawer);
  // Seeded from the server render instead of fetched on mount. The badge used
  // to require a client round-trip after hydration before it could show a
  // count — on every page load, and twice in dev under StrictMode. The layout
  // already renders on the server, so it can hand the first payload down and
  // the badge is correct on first paint. Opening the popover still refetches,
  // so the numbers stay live.
  const [data, setData] = React.useState<NotificationsData>(initialData);
  const [open, setOpen] = React.useState(false);

  const count = data
    ? data.overdueTasks.length + data.blockedTasks.length + data.followUpsDue.length + data.upcomingMeetings.length + data.risksDue.length
    : 0;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) fetchNotifications().then(setData); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span
              className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-medium"
              style={{ background: "var(--coral)", color: "#fff" }}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="max-h-96 overflow-y-auto p-2">
          {count === 0 ? (
            <p className="px-3 py-6 text-center text-xs" style={{ color: "var(--muted-2)" }}>You&apos;re all caught up.</p>
          ) : (
            <>
              <Group icon={AlertTriangle} label="Overdue" color="var(--coral)" items={data.overdueTasks.map((t) => ({ id: t.id, label: `${t.taskKey} ${t.title}`, onClick: () => { openTaskDrawer(t.id); setOpen(false); } }))} />
              <Group icon={Ban} label="Blocked" color="var(--coral)" items={data.blockedTasks.map((t) => ({ id: t.id, label: `${t.taskKey} ${t.title}`, onClick: () => { openTaskDrawer(t.id); setOpen(false); } }))} />
              <Group icon={PhoneCall} label="Follow-ups due" color="var(--amber)" items={data.followUpsDue.map((f) => ({ id: f.id, label: f.topic, onClick: () => { router.push("/follow-ups"); setOpen(false); } }))} />
              <Group icon={Video} label="Meeting soon" color="var(--settled)" items={data.upcomingMeetings.map((m) => ({ id: m.id, label: m.title, onClick: () => { router.push("/meetings"); setOpen(false); } }))} />
              <Group icon={ShieldAlert} label="Risk due" color="var(--amber)" items={data.risksDue.map((r) => ({ id: r.id, label: r.risk, onClick: () => { router.push("/risks"); setOpen(false); } }))} />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Group({
  icon: Icon,
  label,
  color,
  items,
}: {
  icon: typeof Bell;
  label: string;
  color: string;
  items: { id: string; label: string; onClick: () => void }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-1">
      <p className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium uppercase tracking-wider" style={{ color }}>
        <Icon className="h-3 w-3" /> {label}
      </p>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-hover)]"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
