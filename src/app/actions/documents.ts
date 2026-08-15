"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { nextTaskKey } from "@/lib/keys";
import { revalidatePath } from "next/cache";
import type { DocumentType } from "@/generated/prisma";

export async function createDocument(input: { title: string; type: DocumentType; projectId?: string | null }) {
  const project = input.projectId ? await db.project.findUnique({ where: { id: input.projectId } }) : null;
  const doc = await db.document.create({ data: { title: input.title, type: input.type, projectId: input.projectId ?? null, content: "" } });
  revalidatePath("/documents");
  if (project) revalidatePath(`/projects/${project.key}`);
  return doc;
}

export async function updateDocument(id: string, data: Partial<{ title: string; content: string } & Record<string, string | null>>) {
  const doc = await db.document.update({ where: { id }, data });
  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
  return doc;
}

export async function convertRequirementsToTasks(documentId: string) {
  const doc = await db.document.findUniqueOrThrow({ where: { id: documentId }, include: { project: true } });
  if (!doc.prdRequirements) return [];
  const lines = doc.prdRequirements.split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
  const user = await getCurrentUser();
  const tasks = [];
  for (const line of lines) {
    const taskKey = await nextTaskKey(doc.project?.key ?? null);
    tasks.push(
      await db.task.create({
        data: { taskKey, title: line, type: "TASK", projectId: doc.projectId, reporterId: user.id },
      })
    );
  }
  revalidatePath(`/documents/${documentId}`);
  if (doc.project) revalidatePath(`/projects/${doc.project.key}`);
  return tasks;
}

export async function deleteDocument(id: string) {
  const doc = await db.document.delete({ where: { id } });
  revalidatePath("/documents");
  return doc;
}
