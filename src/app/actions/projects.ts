"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { ProjectStatus, Health, Priority } from "@/generated/prisma";
import { PROJECT_STATUS_META } from "@/lib/domain";

export async function createProject(input: {
  key: string;
  name: string;
  description?: string;
  priority?: Priority;
  initiativeId?: string | null;
  targetDate?: Date | null;
}) {
  const user = await getCurrentUser();
  const project = await db.project.create({
    data: {
      key: input.key.toUpperCase(),
      name: input.name,
      description: input.description,
      priority: input.priority ?? "P2",
      ownerId: user.id,
      initiativeId: input.initiativeId ?? null,
      targetDate: input.targetDate ?? null,
    },
  });
  await logActivity({ entityType: "Project", entityId: project.id, action: "created", message: `Created project ${project.key}`, projectId: project.id });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return project;
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const before = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const updated = await db.project.update({ where: { id: projectId }, data: { status } });
  await logActivity({ entityType: "Project", entityId: projectId, action: "status_changed", message: `moved ${before.key} to ${PROJECT_STATUS_META[status].label}`, fromValue: before.status, toValue: status, projectId });
  revalidatePath("/projects");
  revalidatePath(`/projects/${before.key}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function updateProjectHealth(projectId: string, health: Health) {
  const before = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const updated = await db.project.update({ where: { id: projectId }, data: { health } });
  await logActivity({ entityType: "Project", entityId: projectId, action: "health_changed", message: `changed ${before.key} health from ${before.health} to ${health}`, fromValue: before.health, toValue: health, projectId });
  revalidatePath("/projects");
  revalidatePath(`/projects/${before.key}`);
  revalidatePath("/dashboard");
  return updated;
}

export async function updateProject(projectId: string, data: Partial<{
  name: string;
  description: string | null;
  priority: Priority;
  ownerId: string | null;
  startDate: Date | null;
  targetDate: Date | null;
}>) {
  const before = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const updated = await db.project.update({ where: { id: projectId }, data });
  revalidatePath("/projects");
  revalidatePath(`/projects/${before.key}`);
  return updated;
}

export async function archiveProject(projectId: string) {
  const before = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  await db.project.update({ where: { id: projectId }, data: { archived: true } });
  await logActivity({ entityType: "Project", entityId: projectId, action: "archived", message: `Archived ${before.key}`, projectId });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function createWorkstream(projectId: string, name: string) {
  const ws = await db.workstream.create({ data: { projectId, name } });
  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  revalidatePath(`/projects/${project.key}`);
  return ws;
}

export async function computeHealthSuggestion(projectId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [overdue, blocked, followUpsOverdue] = await Promise.all([
    db.task.count({ where: { projectId, dueDate: { lt: startOfToday }, status: { not: "DONE" } } }),
    db.task.count({ where: { projectId, status: "BLOCKED" } }),
    db.followUp.count({ where: { relatedProjectId: projectId, followUpDate: { lt: startOfToday }, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
  ]);
  if (blocked > 0) return { health: "BLOCKED" as const, reason: `${blocked} blocked task${blocked === 1 ? "" : "s"}` };
  if (overdue >= 3 || followUpsOverdue >= 2) return { health: "AT_RISK" as const, reason: `${overdue} overdue task${overdue === 1 ? "" : "s"}, ${followUpsOverdue} overdue follow-up${followUpsOverdue === 1 ? "" : "s"}` };
  if (overdue > 0) return { health: "AT_RISK" as const, reason: `${overdue} overdue task${overdue === 1 ? "" : "s"}` };
  return { health: "ON_TRACK" as const, reason: "No overdue or blocked work" };
}
