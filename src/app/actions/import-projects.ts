"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { logActivity } from "@/lib/activity";
import { buildTaskCreateData } from "@/lib/tasks/create-data";
import {
  PROJECTS_SHEET,
  TASKS_SHEET,
  PROJECT_COLUMNS,
  TASK_COLUMNS,
} from "@/lib/import/columns";
import {
  parseImportWorkbook,
  resolveCrossReferences,
  type RowIssue,
} from "@/lib/import/parse";
import type { Health, Priority, ProjectStatus, TaskStatus, TaskType } from "@/generated/prisma";

const HEADER_FILL = "FF4C7EF0";

/** Built from the same column specs the parser reads, so the template can
 * never describe a shape the importer doesn't accept. */
export async function generateImportTemplate(): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WTS";
  workbook.created = new Date();

  for (const [name, columns] of [
    [PROJECTS_SHEET, PROJECT_COLUMNS],
    [TASKS_SHEET, TASK_COLUMNS],
  ] as const) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = columns.map((c) => ({ header: c.header, key: c.header, width: c.width }));
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    header.height = 20;
    // One example row showing the expected formats. Delete it before importing;
    // if it's left in, it imports as an ordinary row like any other.
    sheet.addRow(Object.fromEntries(columns.map((c) => [c.header, c.example])));
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}

export type ImportPreview = {
  fatal: string | null;
  projectsToCreate: { key: string; name: string }[];
  projectsToUpdate: { key: string; name: string }[];
  tasksToCreate: number;
  tasksSkippedExisting: number;
  issues: RowIssue[];
  /** Echoed back to the commit step so the file is parsed exactly once and
   * what you confirmed is what gets written. */
  payload: string | null;
};

type CommitPayload = {
  fileName: string;
  projects: {
    key: string; name: string; description: string | null;
    status: string; health: string; priority: string;
    ownerId: string | null; startDate: string | null; targetDate: string | null;
    exists: boolean;
  }[];
  tasks: {
    projectKey: string; title: string; description: string | null;
    type: string; status: string; priority: string;
    assigneeId: string | null; dueDate: string | null; parentTitle: string | null;
  }[];
  issues: RowIssue[];
};

/** Matches a spreadsheet's Owner/Assignee cell to a real team member: exact
 * email first, then name. Deliberately never creates a user — an unmatched
 * name means the person hasn't signed into WTS, and inventing a record for
 * them would quietly produce a phantom teammate. */
function buildUserMatcher(users: { id: string; name: string; email: string }[]) {
  const byEmail = new Map(users.map((u) => [u.email.trim().toLowerCase(), u.id]));
  const byName = new Map(users.map((u) => [u.name.trim().toLowerCase(), u.id]));
  return (raw: string | null) => {
    if (!raw) return null;
    const k = raw.trim().toLowerCase();
    return byEmail.get(k) ?? byName.get(k) ?? null;
  };
}

export async function previewImport(fileBase64: string, fileName: string): Promise<ImportPreview> {
  await getCurrentUser();

  const parsed = await parseImportWorkbook(Buffer.from(fileBase64, "base64"));
  if (parsed.fatal) {
    return { fatal: parsed.fatal, projectsToCreate: [], projectsToUpdate: [], tasksToCreate: 0, tasksSkippedExisting: 0, issues: parsed.issues, payload: null };
  }

  const [existingProjects, users] = await Promise.all([
    db.project.findMany({ select: { id: true, key: true } }),
    db.user.findMany({ select: { id: true, name: true, email: true } }),
  ]);
  const existingByKey = new Map(existingProjects.map((p) => [p.key, p.id]));
  const matchUser = buildUserMatcher(users);

  const { tasks, issues: refIssues } = resolveCrossReferences(parsed, new Set(existingByKey.keys()));
  const issues = [...parsed.issues, ...refIssues];

  // Tasks match on (project key + title). Existing ones are left alone rather
  // than updated, so edits made in the app aren't clobbered by a re-import and
  // running the same file twice is a no-op.
  const targetKeys = [...new Set(tasks.map((t) => t.projectKey))];
  const existingTitles = targetKeys.length
    ? await db.task.findMany({
        where: { project: { key: { in: targetKeys } } },
        select: { title: true, project: { select: { key: true } } },
      })
    : [];
  const alreadyThere = new Set(existingTitles.map((t) => `${t.project?.key}::${t.title.toLowerCase()}`));

  const newTasks = tasks.filter((t) => !alreadyThere.has(`${t.projectKey}::${t.title.toLowerCase()}`));
  const skipped = tasks.length - newTasks.length;

  for (const p of parsed.projects) {
    if (p.ownerRaw && !matchUser(p.ownerRaw)) {
      issues.push({ sheet: PROJECTS_SHEET, row: p.row, message: `Owner "${p.ownerRaw}" isn't a WTS user — left unassigned.`, blocking: false });
    }
  }
  for (const t of newTasks) {
    if (t.assigneeRaw && !matchUser(t.assigneeRaw)) {
      issues.push({ sheet: TASKS_SHEET, row: t.row, message: `Assignee "${t.assigneeRaw}" isn't a WTS user — left unassigned.`, blocking: false });
    }
  }

  const payload: CommitPayload = {
    fileName,
    projects: parsed.projects.map((p) => ({
      key: p.key, name: p.name, description: p.description,
      status: p.status, health: p.health, priority: p.priority,
      ownerId: matchUser(p.ownerRaw),
      startDate: p.startDate?.toISOString() ?? null,
      targetDate: p.targetDate?.toISOString() ?? null,
      exists: existingByKey.has(p.key),
    })),
    tasks: newTasks.map((t) => ({
      projectKey: t.projectKey, title: t.title, description: t.description,
      type: t.type, status: t.status, priority: t.priority,
      assigneeId: matchUser(t.assigneeRaw),
      dueDate: t.dueDate?.toISOString() ?? null,
      parentTitle: t.parentTitle,
    })),
    issues,
  };

  return {
    fatal: null,
    projectsToCreate: parsed.projects.filter((p) => !existingByKey.has(p.key)).map((p) => ({ key: p.key, name: p.name })),
    projectsToUpdate: parsed.projects.filter((p) => existingByKey.has(p.key)).map((p) => ({ key: p.key, name: p.name })),
    tasksToCreate: newTasks.length,
    tasksSkippedExisting: skipped,
    issues,
    payload: JSON.stringify(payload),
  };
}

export type ImportResult = { projectsCreated: number; projectsUpdated: number; tasksCreated: number; issues: RowIssue[] };

export async function commitImport(payloadJson: string): Promise<ImportResult> {
  const user = await getCurrentUser();
  const payload: CommitPayload = JSON.parse(payloadJson);

  const result = await db.$transaction(
    async (tx) => {
      let created = 0;
      let updated = 0;

      const projectIdByKey = new Map<string, string>();
      for (const p of payload.projects) {
        const data = {
          name: p.name,
          description: p.description,
          status: p.status as ProjectStatus,
          health: p.health as Health,
          priority: p.priority as Priority,
          ownerId: p.ownerId,
          startDate: p.startDate ? new Date(p.startDate) : null,
          targetDate: p.targetDate ? new Date(p.targetDate) : null,
        };
        const row = await tx.project.upsert({
          where: { key: p.key },
          update: data,
          create: { key: p.key, ...data },
        });
        projectIdByKey.set(p.key, row.id);
        if (p.exists) updated++;
        else created++;
      }

      // Any project referenced by a task but not present in the Projects sheet
      // already exists (the parser rejected genuinely unknown keys).
      const missing = [...new Set(payload.tasks.map((t) => t.projectKey))].filter((k) => !projectIdByKey.has(k));
      if (missing.length) {
        for (const row of await tx.project.findMany({ where: { key: { in: missing } }, select: { id: true, key: true } })) {
          projectIdByKey.set(row.key, row.id);
        }
      }

      // Task keys are allocated in memory from one high-water mark per prefix
      // rather than by calling nextTaskKey() per row. That helper re-reads the
      // max on every call, which inside a loop is both N extra round-trips and
      // the exact path that produced duplicate keys before (see BUILD_LOG).
      const prefixes = [...projectIdByKey.keys()];
      const counters = new Map<string, number>();
      if (prefixes.length) {
        const existing = await tx.task.findMany({
          where: { OR: prefixes.map((p) => ({ taskKey: { startsWith: `${p}-` } })) },
          select: { taskKey: true },
        });
        for (const prefix of prefixes) {
          const max = existing.reduce((acc, { taskKey }) => {
            if (!taskKey.startsWith(`${prefix}-`)) return acc;
            const n = Number(taskKey.slice(prefix.length + 1));
            return Number.isFinite(n) && n > acc ? n : acc;
          }, 99);
          counters.set(prefix, max);
        }
      }
      const nextKey = (prefix: string) => {
        const n = (counters.get(prefix) ?? 99) + 1;
        counters.set(prefix, n);
        return `${prefix}-${n}`;
      };

      // Same field mapping and defaults as createTask(), through the one
      // shared builder — imported rows are indistinguishable from hand-created
      // ones, and neither path can drift from the other.
      const rowData = (t: CommitPayload["tasks"][number], parentTaskId: string | null) =>
        buildTaskCreateData(
          {
            title: t.title,
            description: t.description,
            type: t.type as TaskType,
            status: t.status as TaskStatus,
            priority: t.priority as Priority,
            projectId: projectIdByKey.get(t.projectKey) ?? null,
            assigneeId: t.assigneeId,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            parentTaskId,
          },
          { taskKey: nextKey(t.projectKey), reporterId: user.id },
        );

      // Parents first so children have a real id to point at.
      const idByTitle = new Map<string, string>();
      for (const t of payload.tasks.filter((t) => !t.parentTitle)) {
        const row = await tx.task.create({ data: rowData(t, null) });
        idByTitle.set(`${t.projectKey}::${t.title.toLowerCase()}`, row.id);
      }
      for (const t of payload.tasks.filter((t) => t.parentTitle)) {
        const parentId = idByTitle.get(`${t.projectKey}::${t.parentTitle!.toLowerCase()}`) ?? null;
        const row = await tx.task.create({ data: rowData(t, parentId) });
        idByTitle.set(`${t.projectKey}::${t.title.toLowerCase()}`, row.id);
      }

      return { projectsCreated: created, projectsUpdated: updated, tasksCreated: payload.tasks.length };
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  await logActivity({
    entityType: "Project",
    entityId: "import",
    action: "imported",
    message: `imported ${result.projectsCreated + result.projectsUpdated} project${result.projectsCreated + result.projectsUpdated === 1 ? "" : "s"} and ${result.tasksCreated} task${result.tasksCreated === 1 ? "" : "s"} from ${payload.fileName}`,
  });

  // Once, after the whole import — not per row.
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");

  return { ...result, issues: payload.issues };
}
