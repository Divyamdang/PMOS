"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  const settings = await db.settings.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return db.settings.create({ data: { id: 1 } });
}

export async function updateSettings(data: Partial<{
  userName: string;
  theme: string;
  accentColor: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  aiEnabled: boolean;
}>) {
  const updated = await db.settings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  revalidatePath("/settings");
  return updated;
}
