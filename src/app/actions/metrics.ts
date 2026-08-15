"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createMetric(input: {
  name: string;
  value: number;
  unit?: string;
  target?: number | null;
  direction?: "up" | "down";
  projectId?: string | null;
  date?: Date;
}) {
  const metric = await db.metric.create({
    data: {
      name: input.name,
      value: input.value,
      unit: input.unit,
      target: input.target,
      direction: input.direction,
      projectId: input.projectId ?? null,
      date: input.date ?? new Date(),
    },
  });
  revalidatePath("/metrics");
  return metric;
}
