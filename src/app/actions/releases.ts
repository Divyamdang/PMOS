"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { ReleaseStatus } from "@/generated/prisma";

export async function createRelease(input: { name: string; version?: string; targetDate?: Date | null; projectIds: string[] }) {
  const release = await db.release.create({
    data: {
      name: input.name,
      version: input.version,
      targetDate: input.targetDate,
      projects: { create: input.projectIds.map((projectId) => ({ projectId })) },
    },
  });
  revalidatePath("/releases");
  return release;
}

export async function updateReleaseStatus(id: string, status: ReleaseStatus) {
  const updated = await db.release.update({ where: { id }, data: { status } });
  revalidatePath("/releases");
  return updated;
}
