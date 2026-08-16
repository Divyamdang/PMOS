import {
  HEALTH_META,
  PROJECT_STATUS_META,
  TASK_STATUS_META,
  TASK_TYPE_META,
  PRIORITY_META,
} from "@/lib/domain";

/** One definition of the import spreadsheet's shape, consumed by both the
 * template generator and the parser. They can't drift apart because there is
 * only one list — add a column here and both sides pick it up. */

export const PROJECTS_SHEET = "Projects";
export const TASKS_SHEET = "Tasks";

export type ColumnSpec = {
  /** Header text written into row 1 and matched (case/space-insensitively)
   * when reading a file back. */
  header: string;
  width: number;
  /** Shown in the template's example row so the expected format is obvious
   * without reading docs. */
  example: string;
};

export const PROJECT_COLUMNS: ColumnSpec[] = [
  { header: "Key", width: 12, example: "PGR" },
  { header: "Name", width: 34, example: "Dynamic PG Routing" },
  { header: "Description", width: 46, example: "Route each transaction to the best-performing gateway." },
  { header: "Status", width: 16, example: "In progress" },
  { header: "Health", width: 14, example: "On track" },
  { header: "Priority", width: 14, example: "P1 High" },
  { header: "Owner", width: 26, example: "you@example.com" },
  { header: "Start Date", width: 14, example: "2026-01-15" },
  { header: "Target Date", width: 14, example: "2026-03-31" },
];

export const TASK_COLUMNS: ColumnSpec[] = [
  { header: "Project Key", width: 14, example: "PGR" },
  { header: "Title", width: 42, example: "Design routing rules engine" },
  { header: "Description", width: 46, example: "Rule evaluation order and fallback behaviour." },
  { header: "Type", width: 16, example: "Feature" },
  { header: "Status", width: 14, example: "Todo" },
  { header: "Priority", width: 14, example: "P1 High" },
  { header: "Assignee", width: 26, example: "you@example.com" },
  { header: "Due Date", width: 14, example: "2026-02-20" },
  { header: "Parent Task", width: 42, example: "" },
];

/** Header text → a stable lookup key, so "Project Key", "project key" and
 * "PROJECT_KEY" all resolve to the same column. */
export function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/** Accepts either the stored enum value (`IN_PROGRESS`) or the human label the
 * app displays and the task export writes (`In progress`), case-insensitively.
 * That's what makes an exported sheet re-importable without hand-editing. */
function enumResolver<T extends string>(
  meta: Record<string, { label: string }>,
): (input: string) => T | null {
  const lookup = new Map<string, string>();
  for (const [value, { label }] of Object.entries(meta)) {
    lookup.set(normalizeHeader(value), value);
    lookup.set(normalizeHeader(label), value);
  }
  return (input: string) => (lookup.get(normalizeHeader(input)) as T | undefined) ?? null;
}

export const resolveProjectStatus = enumResolver(PROJECT_STATUS_META);
export const resolveHealth = enumResolver(HEALTH_META);
export const resolveTaskStatus = enumResolver(TASK_STATUS_META);
export const resolveTaskType = enumResolver(TASK_TYPE_META);
export const resolvePriority = enumResolver(PRIORITY_META);

/** Defaults applied when a cell is blank, matching the Prisma schema's own
 * `@default(...)` so imported rows land identically to hand-created ones. */
export const DEFAULTS = {
  projectStatus: "PLANNED",
  health: "ON_TRACK",
  priority: "P2",
  taskStatus: "TODO",
  taskType: "TASK",
} as const;
