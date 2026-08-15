"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { nextTaskKey } from "@/lib/keys";
import { revalidatePath } from "next/cache";

export async function createMeeting(input: {
  title: string;
  date: Date;
  projectId?: string | null;
  agenda?: string;
  notes?: string;
  participantIds?: string[];
}) {
  const meeting = await db.meeting.create({
    data: {
      title: input.title,
      date: input.date,
      projectId: input.projectId ?? null,
      agenda: input.agenda,
      notes: input.notes,
      participants: input.participantIds ? { create: input.participantIds.map((personId) => ({ personId })) } : undefined,
    },
  });
  revalidatePath("/meetings");
  if (input.projectId) {
    const project = await db.project.findUnique({ where: { id: input.projectId } });
    if (project) revalidatePath(`/projects/${project.key}`);
  }
  return meeting;
}

export async function addActionItem(meetingId: string, description: string, ownerName?: string, dueDate?: Date | null) {
  const item = await db.actionItem.create({ data: { meetingId, description, ownerName, dueDate } });
  revalidatePath("/meetings");
  return item;
}

export async function convertActionItemToTask(actionItemId: string) {
  const item = await db.actionItem.findUniqueOrThrow({ where: { id: actionItemId }, include: { meeting: { include: { project: true } } } });
  const user = await getCurrentUser();
  const taskKey = await nextTaskKey(item.meeting.project?.key ?? null);
  const task = await db.task.create({
    data: {
      taskKey,
      title: item.description,
      type: "TASK",
      projectId: item.meeting.projectId,
      dueDate: item.dueDate,
      reporterId: user.id,
    },
  });
  await db.actionItem.update({ where: { id: actionItemId }, data: { convertedTaskId: task.id } });
  revalidatePath("/meetings");
  revalidatePath("/tasks");
  if (item.meeting.project) revalidatePath(`/projects/${item.meeting.project.key}`);
  return task;
}
