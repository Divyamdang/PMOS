"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { revalidatePath } from "next/cache";

export async function getPreferences() {
  const user = await getCurrentUser();
  const prefs = await db.userPreferences.findUnique({ where: { userId: user.id } });
  if (prefs) return prefs;
  return db.userPreferences.create({ data: { userId: user.id } });
}

export async function updatePreferences(data: Partial<{
  theme: string;
  workingHoursStart: string;
  workingHoursEnd: string;
}>) {
  const user = await getCurrentUser();
  const updated = await db.userPreferences.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  revalidatePath("/settings");
  return updated;
}
