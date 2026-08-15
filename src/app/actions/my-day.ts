"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { PlanBucket } from "@/generated/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function planTask(taskId: string, bucket: PlanBucket | null) {
  await db.task.update({
    where: { id: taskId },
    data: { planBucket: bucket, planDate: bucket ? startOfToday() : null },
  });
  revalidatePath("/my-day");
  revalidatePath("/dashboard");
}
