"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { revalidatePath } from "next/cache";

export async function createInitiative(input: { name: string; description?: string; targetDate?: Date | null }) {
  const user = await getCurrentUser();
  const initiative = await db.initiative.create({
    data: { name: input.name, description: input.description, targetDate: input.targetDate, ownerId: user.id },
  });
  revalidatePath("/initiatives");
  return initiative;
}

export async function assignProjectToInitiative(projectId: string, initiativeId: string | null) {
  const project = await db.project.update({ where: { id: projectId }, data: { initiativeId } });
  revalidatePath("/initiatives");
  revalidatePath("/projects");
  return project;
}
