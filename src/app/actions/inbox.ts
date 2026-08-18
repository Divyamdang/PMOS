"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { nextTaskKey } from "@/lib/keys";
import { logActivity } from "@/lib/activity";
import { isOwnWorkType } from "@/lib/domain";
import { revalidatePath } from "next/cache";
import type { InboxConversion, TaskType } from "@/generated/prisma";

export async function captureInboxItem(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const user = await getCurrentUser();
  await db.inboxItem.create({ data: { text: trimmed, userId: user.id } });
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

export async function deleteInboxItem(id: string) {
  await db.inboxItem.delete({ where: { id } });
  revalidatePath("/inbox");
}

const CONVERSION_TASK_TYPE: Record<InboxConversion, TaskType> = {
  TASK: "TASK",
  FOLLOW_UP: "FOLLOW_UP",
  REMINDER: "REMINDER",
  MEETING: "MEETING",
  RESEARCH: "RESEARCH",
  IDEA: "IDEA",
};

export async function convertInboxItem(id: string, conversion: InboxConversion) {
  const item = await db.inboxItem.findUniqueOrThrow({ where: { id } });
  const user = await getCurrentUser();
  const taskKey = await nextTaskKey(null);
  const task = await db.task.create({
    data: {
      taskKey,
      title: item.text,
      type: CONVERSION_TASK_TYPE[conversion],
      isPersonal: true,
      assigneeId: user.id,
      reporterId: user.id,
    },
  });
  await db.inboxItem.update({ where: { id }, data: { converted: true, convertedType: conversion, convertedTaskId: task.id } });
  await logActivity({ entityType: "Task", entityId: task.id, action: "created", message: `Created ${taskKey} from Inbox`, taskId: task.id });
  revalidatePath("/inbox");
  revalidatePath("/my-work");
  revalidatePath("/dashboard");
  return task;
}

/** Converts an inbox item into a task using an AI-drafted set of fields the
 * user has already reviewed and confirmed — never writes AI output straight
 * through without that confirmation step. */
export async function convertInboxItemWithDraft(
  id: string,
  draft: { title: string; type: TaskType; priority: "P0" | "P1" | "P2" | "P3"; description: string; subtasks: string[]; projectId: string | null }
) {
  const user = await getCurrentUser();
  const project = draft.projectId ? await db.project.findUnique({ where: { id: draft.projectId } }) : null;
  const taskKey = await nextTaskKey(project?.key ?? null);
  const task = await db.task.create({
    data: {
      taskKey,
      title: draft.title,
      description: draft.description || undefined,
      type: draft.type,
      priority: draft.priority,
      projectId: draft.projectId,
      // Derived from the task type, not from whether a project is attached —
      // a follow-up or meeting about a project is still the PM's own work and
      // belongs in My Day. Tying this to projectId used to hide exactly those.
      isPersonal: isOwnWorkType(draft.type),
      assigneeId: user.id,
      reporterId: user.id,
    },
  });
  for (const title of draft.subtasks) {
    const subtaskKey = await nextTaskKey(project?.key ?? null);
    await db.task.create({
      data: { taskKey: subtaskKey, title, type: "TASK", parentTaskId: task.id, projectId: draft.projectId, assigneeId: user.id, reporterId: user.id },
    });
  }
  await db.inboxItem.update({ where: { id }, data: { converted: true, convertedType: "TASK", convertedTaskId: task.id } });
  await logActivity({ entityType: "Task", entityId: task.id, action: "created", message: `Created ${taskKey} from Inbox (AI-assisted)`, taskId: task.id, projectId: draft.projectId ?? undefined });
  revalidatePath("/inbox");
  revalidatePath("/my-work");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}
