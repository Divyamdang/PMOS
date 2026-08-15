"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { WaitingForStatus } from "@/generated/prisma";

export async function createWaitingForItem(input: {
  who: string;
  what: string;
  personId?: string | null;
  vendorId?: string | null;
  projectId?: string | null;
  expectedDate?: Date | null;
  followUpDate?: Date | null;
}) {
  const item = await db.waitingForItem.create({
    data: {
      who: input.who,
      what: input.what,
      personId: input.personId ?? null,
      vendorId: input.vendorId ?? null,
      projectId: input.projectId ?? null,
      expectedDate: input.expectedDate ?? null,
      followUpDate: input.followUpDate ?? null,
    },
  });
  revalidatePath("/waiting-for");
  revalidatePath("/dashboard");
  return item;
}

export async function updateWaitingForStatus(id: string, status: WaitingForStatus) {
  const updated = await db.waitingForItem.update({ where: { id }, data: { status } });
  revalidatePath("/waiting-for");
  revalidatePath("/dashboard");
  return updated;
}
