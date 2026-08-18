import type { Priority, TaskStatus, TaskType } from "@/generated/prisma";
import { isOwnWorkType } from "@/lib/domain";

export type TaskCreateInput = {
  title: string;
  description?: string | null;
  type?: TaskType | null;
  status?: TaskStatus | null;
  priority?: Priority | null;
  projectId?: string | null;
  workstreamId?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  parentTaskId?: string | null;
  isPersonal?: boolean | null;
};

/** The one place a task's stored fields and defaults are decided.
 *
 * Both `createTask()` and the Excel importer build their rows through this, so
 * a task typed into the app and a task read out of a spreadsheet are identical
 * by construction — progress, health and every rollup treat them the same, and
 * changing a default here can't leave one path behind.
 *
 * Pure on purpose: no database access, no key generation. The caller supplies
 * `taskKey` and `reporterId`, because those come from different places on each
 * path (one lookup per task when creating interactively, one batch-allocated
 * sequence when importing). */
export function buildTaskCreateData(
  input: TaskCreateInput,
  meta: { taskKey: string; reporterId: string },
) {
  const status = input.status ?? "TODO";
  const type = input.type ?? "TASK";
  return {
    taskKey: meta.taskKey,
    title: input.title,
    description: input.description ?? null,
    type,
    status,
    priority: input.priority ?? "P2",
    projectId: input.projectId ?? null,
    workstreamId: input.workstreamId ?? null,
    assigneeId: input.assigneeId ?? null,
    reporterId: meta.reporterId,
    dueDate: input.dueDate ?? null,
    parentTaskId: input.parentTaskId ?? null,
    // Defaults from the task type — a Meeting or Follow-up is the PM's own
    // work, a Feature or Bug is project delivery — and only when the caller
    // hasn't said otherwise, so an explicit toggle always wins. Deliberately
    // independent of projectId: a follow-up about a project is still the PM's
    // own work and belongs in My Day.
    isPersonal: input.isPersonal ?? isOwnWorkType(type),
    // Kept consistent with updateTaskStatus(), which stamps this whenever a
    // task lands in DONE — otherwise a task imported as already-done would
    // never register a completion date and would skew cycle-time analytics.
    completedAt: status === "DONE" ? new Date() : null,
  };
}
