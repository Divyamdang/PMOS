"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function createDecision(input: {
  decision: string;
  context?: string;
  alternatives?: string;
  reason?: string;
  outcome?: string;
  projectId?: string | null;
  vendorId?: string | null;
  date?: Date;
}) {
  const user = await getCurrentUser();
  const project = input.projectId ? await db.project.findUnique({ where: { id: input.projectId } }) : null;
  const decision = await db.decision.create({
    data: {
      decision: input.decision,
      context: input.context,
      alternatives: input.alternatives,
      reason: input.reason,
      outcome: input.outcome,
      relatedProjectId: input.projectId ?? null,
      vendorId: input.vendorId ?? null,
      ownerId: user.id,
      date: input.date ?? new Date(),
    },
  });
  await logActivity({ entityType: "Decision", entityId: decision.id, action: "created", message: `Recorded decision "${decision.decision}"`, projectId: decision.relatedProjectId ?? undefined });
  revalidatePath("/decisions");
  if (project) revalidatePath(`/projects/${project.key}`);
  return decision;
}
