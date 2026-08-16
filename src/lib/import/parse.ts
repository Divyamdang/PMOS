import ExcelJS from "exceljs";
import {
  PROJECTS_SHEET,
  TASKS_SHEET,
  PROJECT_COLUMNS,
  TASK_COLUMNS,
  DEFAULTS,
  normalizeHeader,
  resolveProjectStatus,
  resolveHealth,
  resolvePriority,
  resolveTaskStatus,
  resolveTaskType,
} from "./columns";

/** A problem with one row. `blocking` rows are dropped from the import;
 * non-blocking ones still import, with the stated fallback applied, and are
 * surfaced in the preview and again in the post-import summary rather than
 * being swallowed. */
export type RowIssue = {
  sheet: string;
  row: number;
  message: string;
  blocking: boolean;
};

export type ParsedProject = {
  row: number;
  key: string;
  name: string;
  description: string | null;
  status: string;
  health: string;
  priority: string;
  ownerRaw: string | null;
  startDate: Date | null;
  targetDate: Date | null;
};

export type ParsedTask = {
  row: number;
  projectKey: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  assigneeRaw: string | null;
  dueDate: Date | null;
  parentTitle: string | null;
};

export type ParseResult = {
  projects: ParsedProject[];
  tasks: ParsedTask[];
  issues: RowIssue[];
  /** Set when the file itself is unusable (wrong format, missing sheets).
   * Nothing is importable in that case and the preview says so plainly. */
  fatal: string | null;
};

/** Excel dates arrive as a Date when the cell is date-formatted, and as text
 * otherwise. Text is accepted in ISO or common day-first forms rather than
 * rejecting a sheet someone typed by hand. */
function parseDate(value: unknown): { date: Date | null; bad: boolean } {
  if (value == null || value === "") return { date: null, bad: false };
  if (value instanceof Date) return { date: value, bad: Number.isNaN(value.getTime()) };

  const text = String(value).trim();
  if (!text) return { date: null, bad: false };

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return { date: Number.isNaN(d.getTime()) ? null : d, bad: Number.isNaN(d.getTime()) };
  }
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return { date: Number.isNaN(d.getTime()) ? null : d, bad: Number.isNaN(d.getTime()) };
  }
  const loose = new Date(text);
  return Number.isNaN(loose.getTime()) ? { date: null, bad: true } : { date: loose, bad: false };
}

function cellText(value: unknown): string {
  if (value == null) return "";
  // A hyperlink or formula cell comes through as an object; the display text
  // is what the person typed, so prefer it.
  if (typeof value === "object") {
    const o = value as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (Array.isArray(o.richText)) return o.richText.map((r) => r.text).join("").trim();
    if (typeof o.text === "string") return o.text.trim();
    if (o.result != null) return String(o.result).trim();
    return "";
  }
  return String(value).trim();
}

/** Maps each expected column to its actual position, so column order in the
 * uploaded file doesn't have to match the template. */
function headerIndex(sheet: ExcelJS.Worksheet, expected: { header: string }[]) {
  const found = new Map<string, number>();
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, col) => {
    const key = normalizeHeader(cellText(cell.value));
    if (key) found.set(key, col);
  });
  const index: Record<string, number | undefined> = {};
  for (const { header } of expected) index[header] = found.get(normalizeHeader(header));
  return index;
}

export async function parseImportWorkbook(buffer: Buffer): Promise<ParseResult> {
  const issues: RowIssue[] = [];
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { projects: [], tasks: [], issues, fatal: "That file isn't a readable .xlsx workbook. Download the template and fill that in." };
  }

  const projectSheet = workbook.getWorksheet(PROJECTS_SHEET);
  const taskSheet = workbook.getWorksheet(TASKS_SHEET);
  if (!projectSheet && !taskSheet) {
    return {
      projects: [], tasks: [], issues,
      fatal: `The workbook needs a "${PROJECTS_SHEET}" sheet and a "${TASKS_SHEET}" sheet. Neither was found.`,
    };
  }

  const projects: ParsedProject[] = [];
  const seenKeys = new Map<string, number>();

  if (projectSheet) {
    const col = headerIndex(projectSheet, PROJECT_COLUMNS);
    if (col["Key"] == null || col["Name"] == null) {
      return { projects: [], tasks: [], issues, fatal: `The "${PROJECTS_SHEET}" sheet needs at least "Key" and "Name" columns.` };
    }

    projectSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const get = (h: string) => (col[h] != null ? cellText(row.getCell(col[h]!).value) : "");
      const key = get("Key").toUpperCase();
      const name = get("Name");
      if (!key && !name) return; // genuinely blank row, not worth reporting

      if (!key) {
        issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: "No project key — row skipped.", blocking: true });
        return;
      }
      if (!name) {
        issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: `${key} has no name — row skipped.`, blocking: true });
        return;
      }
      const dupe = seenKeys.get(key);
      if (dupe) {
        issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: `Key ${key} already used on row ${dupe} — this row skipped.`, blocking: true });
        return;
      }
      seenKeys.set(key, rowNumber);

      const statusRaw = get("Status");
      const status = statusRaw ? resolveProjectStatus(statusRaw) : DEFAULTS.projectStatus;
      if (statusRaw && !status) {
        issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: `Unrecognised status "${statusRaw}" — defaulting to Planned.`, blocking: false });
      }
      const healthRaw = get("Health");
      const health = healthRaw ? resolveHealth(healthRaw) : DEFAULTS.health;
      if (healthRaw && !health) {
        issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: `Unrecognised health "${healthRaw}" — defaulting to On track.`, blocking: false });
      }
      const priorityRaw = get("Priority");
      const priority = priorityRaw ? resolvePriority(priorityRaw) : DEFAULTS.priority;
      if (priorityRaw && !priority) {
        issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: `Unrecognised priority "${priorityRaw}" — defaulting to P2.`, blocking: false });
      }

      const start = parseDate(col["Start Date"] != null ? row.getCell(col["Start Date"]!).value : null);
      if (start.bad) issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: `Start date couldn't be read — left empty.`, blocking: false });
      const target = parseDate(col["Target Date"] != null ? row.getCell(col["Target Date"]!).value : null);
      if (target.bad) issues.push({ sheet: PROJECTS_SHEET, row: rowNumber, message: `Target date couldn't be read — left empty.`, blocking: false });

      projects.push({
        row: rowNumber,
        key,
        name,
        description: get("Description") || null,
        status: status ?? DEFAULTS.projectStatus,
        health: health ?? DEFAULTS.health,
        priority: priority ?? DEFAULTS.priority,
        ownerRaw: get("Owner") || null,
        startDate: start.date,
        targetDate: target.date,
      });
    });
  }

  const tasks: ParsedTask[] = [];

  if (taskSheet) {
    const col = headerIndex(taskSheet, TASK_COLUMNS);
    if (col["Title"] == null) {
      return { projects: [], tasks: [], issues, fatal: `The "${TASKS_SHEET}" sheet needs a "Title" column.` };
    }

    taskSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const get = (h: string) => (col[h] != null ? cellText(row.getCell(col[h]!).value) : "");
      const title = get("Title");
      const projectKey = get("Project Key").toUpperCase();
      if (!title && !projectKey) return;

      if (!title) {
        issues.push({ sheet: TASKS_SHEET, row: rowNumber, message: "No title — row skipped.", blocking: true });
        return;
      }

      const statusRaw = get("Status");
      const status = statusRaw ? resolveTaskStatus(statusRaw) : DEFAULTS.taskStatus;
      if (statusRaw && !status) {
        issues.push({ sheet: TASKS_SHEET, row: rowNumber, message: `Unrecognised status "${statusRaw}" — defaulting to Todo.`, blocking: false });
      }
      const typeRaw = get("Type");
      const type = typeRaw ? resolveTaskType(typeRaw) : DEFAULTS.taskType;
      if (typeRaw && !type) {
        issues.push({ sheet: TASKS_SHEET, row: rowNumber, message: `Unrecognised type "${typeRaw}" — defaulting to Task.`, blocking: false });
      }
      const priorityRaw = get("Priority");
      const priority = priorityRaw ? resolvePriority(priorityRaw) : DEFAULTS.priority;
      if (priorityRaw && !priority) {
        issues.push({ sheet: TASKS_SHEET, row: rowNumber, message: `Unrecognised priority "${priorityRaw}" — defaulting to P2.`, blocking: false });
      }

      const due = parseDate(col["Due Date"] != null ? row.getCell(col["Due Date"]!).value : null);
      if (due.bad) issues.push({ sheet: TASKS_SHEET, row: rowNumber, message: `Due date couldn't be read — left empty.`, blocking: false });

      tasks.push({
        row: rowNumber,
        projectKey,
        title,
        description: get("Description") || null,
        type: type ?? DEFAULTS.taskType,
        status: status ?? DEFAULTS.taskStatus,
        priority: priority ?? DEFAULTS.priority,
        assigneeRaw: get("Assignee") || null,
        dueDate: due.date,
        parentTitle: get("Parent Task") || null,
      });
    });
  }

  return { projects, tasks, issues, fatal: null };
}

/** Cross-sheet checks that can only run once both sheets are parsed: does a
 * task point at a project that exists, and does a `Parent Task` resolve to a
 * real sibling row in the same project (and not to itself). */
export function resolveCrossReferences(
  result: ParseResult,
  existingProjectKeys: Set<string>,
): { tasks: ParsedTask[]; issues: RowIssue[] } {
  const issues: RowIssue[] = [];
  const importedKeys = new Set(result.projects.map((p) => p.key));
  const knownKeys = new Set([...importedKeys, ...existingProjectKeys]);

  const titlesByProject = new Map<string, Set<string>>();
  for (const t of result.tasks) {
    if (!titlesByProject.has(t.projectKey)) titlesByProject.set(t.projectKey, new Set());
    titlesByProject.get(t.projectKey)!.add(t.title.toLowerCase());
  }

  const kept: ParsedTask[] = [];
  for (const t of result.tasks) {
    if (!t.projectKey) {
      issues.push({ sheet: TASKS_SHEET, row: t.row, message: `"${t.title}" has no project key — row skipped.`, blocking: true });
      continue;
    }
    if (!knownKeys.has(t.projectKey)) {
      issues.push({
        sheet: TASKS_SHEET, row: t.row,
        message: `Project ${t.projectKey} isn't in this file or in WTS — row skipped.`,
        blocking: true,
      });
      continue;
    }
    if (t.parentTitle) {
      if (t.parentTitle.toLowerCase() === t.title.toLowerCase()) {
        issues.push({ sheet: TASKS_SHEET, row: t.row, message: `"${t.title}" lists itself as its parent — imported as a top-level task.`, blocking: false });
        kept.push({ ...t, parentTitle: null });
        continue;
      }
      if (!titlesByProject.get(t.projectKey)?.has(t.parentTitle.toLowerCase())) {
        issues.push({
          sheet: TASKS_SHEET, row: t.row,
          message: `Parent "${t.parentTitle}" isn't a task in ${t.projectKey} in this file — imported as a top-level task.`,
          blocking: false,
        });
        kept.push({ ...t, parentTitle: null });
        continue;
      }
    }
    kept.push(t);
  }

  return { tasks: kept, issues };
}
