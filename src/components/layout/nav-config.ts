import {
  LayoutDashboard,
  Sun,
  FolderKanban,
  Briefcase,
  Inbox,
  PhoneCall,
  Clock,
  ListChecks,
  CalendarDays,
  Users,
  Building2,
  Video,
  Layers,
  ShieldAlert,
  GitBranch,
  Rocket,
  FileText,
  LineChart,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "D" },
      { href: "/my-day", label: "My Day", icon: Sun },
      { href: "/projects", label: "Projects", icon: FolderKanban, shortcut: "P" },
    ],
  },
  {
    label: "My work",
    items: [
      { href: "/my-work", label: "My Work", icon: Briefcase },
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/follow-ups", label: "Follow-ups", icon: PhoneCall, shortcut: "F" },
      { href: "/waiting-for", label: "Waiting For", icon: Clock, shortcut: "W" },
      { href: "/tasks", label: "Tasks", icon: ListChecks },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Relationships",
    items: [
      { href: "/people", label: "People", icon: Users },
      { href: "/vendors", label: "Vendors", icon: Building2 },
      { href: "/meetings", label: "Meetings", icon: Video },
    ],
  },
  {
    label: "Product",
    items: [
      { href: "/initiatives", label: "Initiatives", icon: Layers },
      { href: "/risks", label: "Risks", icon: ShieldAlert },
      { href: "/decisions", label: "Decisions", icon: GitBranch },
      { href: "/releases", label: "Releases", icon: Rocket },
      { href: "/documents", label: "Documents", icon: FileText },
      { href: "/metrics", label: "Metrics", icon: LineChart },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/settings", label: "Settings", icon: Settings };
