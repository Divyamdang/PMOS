// Shared enum → label/color mappings. Single source of truth so every
// screen renders status/priority/health identically.

export const HEALTH_META = {
  ON_TRACK: { label: "On track", color: "var(--settled)", soft: "var(--settled-soft)" },
  AT_RISK: { label: "At risk", color: "var(--amber)", soft: "var(--amber-soft)" },
  OFF_TRACK: { label: "Off track", color: "var(--coral)", soft: "var(--coral-soft)" },
  BLOCKED: { label: "Blocked", color: "var(--coral)", soft: "var(--coral-soft)" },
} as const;

export const PROJECT_STATUS_META = {
  BACKLOG: { label: "Backlog", color: "var(--muted-2)" },
  PLANNED: { label: "Planned", color: "var(--muted-2)" },
  IN_PROGRESS: { label: "In progress", color: "var(--route)" },
  AT_RISK: { label: "At risk", color: "var(--amber)" },
  BLOCKED: { label: "Blocked", color: "var(--coral)" },
  COMPLETED: { label: "Completed", color: "var(--settled)" },
} as const;

export const PROJECT_KANBAN_COLUMNS = [
  "BACKLOG",
  "PLANNED",
  "IN_PROGRESS",
  "AT_RISK",
  "BLOCKED",
  "COMPLETED",
] as const;

export const TASK_STATUS_META = {
  BACKLOG: { label: "Backlog", color: "var(--muted-2)" },
  TODO: { label: "Todo", color: "var(--muted-2)" },
  IN_PROGRESS: { label: "In progress", color: "var(--route)" },
  WAITING: { label: "Waiting", color: "var(--amber)" },
  BLOCKED: { label: "Blocked", color: "var(--coral)" },
  DONE: { label: "Done", color: "var(--settled)" },
} as const;

export const TASK_KANBAN_COLUMNS = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "WAITING",
  "BLOCKED",
  "DONE",
] as const;

export const PRIORITY_META = {
  P0: { label: "P0 Critical", color: "var(--coral)" },
  P1: { label: "P1 High", color: "var(--amber)" },
  P2: { label: "P2 Medium", color: "var(--route)" },
  P3: { label: "P3 Low", color: "var(--muted-2)" },
} as const;

export const TASK_TYPE_META = {
  TASK: { label: "Task" },
  FEATURE: { label: "Feature" },
  BUG: { label: "Bug" },
  IMPROVEMENT: { label: "Improvement" },
  TECH_DEBT: { label: "Tech debt" },
  RESEARCH: { label: "Research" },
  ANALYTICS: { label: "Analytics" },
  FOLLOW_UP: { label: "Follow-up" },
  MEETING: { label: "Meeting" },
  CALL: { label: "Call" },
  COMMUNICATION: { label: "Communication" },
  REMINDER: { label: "Reminder" },
  VENDOR: { label: "Vendor" },
  INCIDENT: { label: "Incident" },
  DECISION: { label: "Decision" },
  DOCUMENTATION: { label: "Documentation" },
  IDEA: { label: "Idea" },
} as const;

export const PERSON_CATEGORY_META = {
  ENGINEERING: { label: "Engineering" },
  DESIGN: { label: "Design" },
  FINANCE: { label: "Finance" },
  OPERATIONS: { label: "Operations" },
  LEADERSHIP: { label: "Leadership" },
  SALES: { label: "Sales" },
  LEGAL: { label: "Legal" },
  COMPLIANCE: { label: "Compliance" },
  VENDOR: { label: "Vendor" },
  EXTERNAL: { label: "External" },
  OTHER: { label: "Other" },
} as const;

export const FOLLOWUP_STATUS_META = {
  TO_CONTACT: { label: "To contact", color: "var(--muted-2)" },
  CONTACTED: { label: "Contacted", color: "var(--route)" },
  WAITING_FOR_RESPONSE: { label: "Waiting for response", color: "var(--amber)" },
  FOLLOW_UP_DUE: { label: "Follow-up due", color: "var(--coral)" },
  RESOLVED: { label: "Resolved", color: "var(--settled)" },
  CLOSED: { label: "Closed", color: "var(--muted-2)" },
} as const;

export const RISK_STATUS_META = {
  MONITORING: { label: "Monitoring", color: "var(--amber)" },
  MITIGATED: { label: "Mitigated", color: "var(--settled)" },
  ESCALATED: { label: "Escalated", color: "var(--coral)" },
  CLOSED: { label: "Closed", color: "var(--muted-2)" },
} as const;

export type MetaKey<T extends Record<string, unknown>> = keyof T;
