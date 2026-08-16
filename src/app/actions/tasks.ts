"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { nextTaskKey } from "@/lib/keys";
import { buildTaskCreateData } from "@/lib/tasks/create-data";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { TaskStatus, TaskType, Priority } from "@/generated/prisma";
import { TASK_STATUS_META } from "@/lib/domain";

function revalidateTaskViews(projectKey?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/my-day");
  revalidatePath("/my-work");
  if (projectKey) revalidatePath(`/projects/${projectKey}`);
}

export async function createTask(input: {
  title: string;
  description?: string;
  type?: TaskType;
  priority?: Priority;
  projectId?: string | null;
  workstreamId?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  parentTaskId?: string | null;
  isPersonal?: boolean;
}) {
  const user = await getCurrentUser();
  const project = input.projectId ? await db.project.findUnique({ where: { id: input.projectId } }) : null;
  const taskKey = await nextTaskKey(project?.key ?? null);

  const task = await db.task.create({
    data: buildTaskCreateData(input, { taskKey, reporterId: user.id }),
  });
  await logActivity({ entityType: "Task", entityId: task.id, action: "created", message: `Created ${taskKey}`, taskId: task.id, projectId: task.projectId ?? undefined });
  revalidateTaskViews(project?.key);
  return task;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId }, include: { project: true } });
  const updated = await db.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
  await logActivity({
    entityType: "Task",
    entityId: taskId,
    action: "status_changed",
    message: `moved ${task.taskKey} to ${TASK_STATUS_META[status].label}`,
    fromValue: task.status,
    toValue: status,
    taskId,
    projectId: task.projectId ?? undefined,
  });
  revalidateTaskViews(task.project?.key);
  return updated;
}

export async function toggleTaskDone(taskId: string) {
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId }, include: { project: true } });
  const next: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
  return updateTaskStatus(taskId, next);
}

export async function updateTask(taskId: string, data: Partial<{
  title: string;
  description: string | null;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: Date | null;
  startDate: Date | null;
  estimate: number | null;
  labels: string | null;
  projectId: string | null;
  workstreamId: string | null;
}>) {
  const before = await db.task.findUniqueOrThrow({ where: { id: taskId }, include: { project: true } });
  const updated = await db.task.update({
    where: { id: taskId },
    data: { ...data, completedAt: data.status === "DONE" ? new Date() : data.status ? null : undefined },
  });

  if (data.status && data.status !== before.status) {
    await logActivity({ entityType: "Task", entityId: taskId, action: "status_changed", message: `moved ${before.taskKey} to ${TASK_STATUS_META[data.status].label}`, fromValue: before.status, toValue: data.status, taskId, projectId: before.projectId ?? undefined });
  }
  if (data.priority && data.priority !== before.priority) {
    await logActivity({ entityType: "Task", entityId: taskId, action: "priority_changed", message: `changed ${before.taskKey} priority from ${before.priority} to ${data.priority}`, fromValue: before.priority, toValue: data.priority, taskId, projectId: before.projectId ?? undefined });
  }
  if (data.assigneeId !== undefined && data.assigneeId !== before.assigneeId) {
    await logActivity({ entityType: "Task", entityId: taskId, action: "assignee_changed", message: `reassigned ${before.taskKey}`, taskId, projectId: before.projectId ?? undefined });
  }

  revalidateTaskViews(before.project?.key);
  return updated;
}

export async function archiveTask(taskId: string) {
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId }, include: { project: true } });
  await db.task.delete({ where: { id: taskId } });
  await logActivity({ entityType: "Task", entityId: taskId, action: "archived", message: `Archived ${task.taskKey}`, projectId: task.projectId ?? undefined });
  revalidateTaskViews(task.project?.key);
}

export async function addSubtask(parentTaskId: string, title: string) {
  const parent = await db.task.findUniqueOrThrow({ where: { id: parentTaskId }, include: { project: true } });
  const taskKey = await nextTaskKey(parent.project?.key ?? null);
  const user = await getCurrentUser();
  const subtask = await db.task.create({
    data: {
      taskKey,
      title,
      type: "TASK",
      projectId: parent.projectId,
      parentTaskId,
      reporterId: user.id,
      assigneeId: parent.assigneeId,
    },
  });
  revalidateTaskViews(parent.project?.key);
  return subtask;
}

export async function addComment(taskId: string, body: string) {
  const user = await getCurrentUser();
  const comment = await db.comment.create({ data: { taskId, body, authorId: user.id } });
  const task = await db.task.findUniqueOrThrow({ where: { id: taskId }, include: { project: true } });
  await logActivity({ entityType: "Task", entityId: taskId, action: "commented", message: `commented on ${task.taskKey}`, taskId, projectId: task.projectId ?? undefined });
  revalidateTaskViews(task.project?.key);
  return comment;
}

export async function addDependency(fromTaskId: string, toTaskId: string, type: "BLOCKS" | "BLOCKED_BY" | "DEPENDS_ON" | "RELATES_TO" | "DUPLICATES") {
  await db.taskDependency.create({ data: { fromTaskId, toTaskId, type } });
  const task = await db.task.findUniqueOrThrow({ where: { id: fromTaskId }, include: { project: true } });
  revalidateTaskViews(task.project?.key);
}

export async function getTaskDetail(taskId: string) {
  return db.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      workstream: true,
      assignee: true,
      reporter: true,
      parentTask: true,
      subtasks: { orderBy: { createdAt: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      dependenciesFrom: { include: { toTask: true } },
      dependenciesTo: { include: { fromTask: true } },
      activityEvents: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 20 },
      person: true,
      vendor: true,
    },
  });
}

export async function listAssignableUsers() {
  return db.user.findMany({ orderBy: { name: "asc" } });
}

export async function removeDependency(id: string) {
  const dep = await db.taskDependency.findUniqueOrThrow({ where: { id }, include: { fromTask: { include: { project: true } } } });
  await db.taskDependency.delete({ where: { id } });
  revalidateTaskViews(dep.fromTask.project?.key);
}
