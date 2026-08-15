"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { FollowUpStatus, FollowUpChannel, Priority } from "@/generated/prisma";

export async function createFollowUp(input: {
  topic: string;
  personId?: string | null;
  vendorId?: string | null;
  channel: FollowUpChannel;
  priority: Priority;
  followUpDate?: Date | null;
  relatedProjectId?: string | null;
  notes?: string;
}) {
  const followUp = await db.followUp.create({
    data: {
      topic: input.topic,
      personId: input.personId ?? null,
      vendorId: input.vendorId ?? null,
      channel: input.channel,
      priority: input.priority,
      followUpDate: input.followUpDate ?? null,
      relatedProjectId: input.relatedProjectId ?? null,
      notes: input.notes,
      lastContactDate: new Date(),
    },
  });
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return followUp;
}

export async function updateFollowUpStatus(id: string, status: FollowUpStatus) {
  const updated = await db.followUp.update({
    where: { id },
    data: { status, lastContactDate: status === "CONTACTED" ? new Date() : undefined },
  });
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return updated;
}
