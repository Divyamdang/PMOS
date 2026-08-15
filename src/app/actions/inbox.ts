"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { nextTaskKey } from "@/lib/keys";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { InboxConversion, TaskType } from "@/generated/prisma";

export async function captureInboxItem(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await db.inboxItem.create({ data: { text: trimmed } });
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
