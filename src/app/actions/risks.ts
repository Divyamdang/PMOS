"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { RiskStatus } from "@/generated/prisma";

function revalidateRiskViews(projectKey?: string | null) {
  revalidatePath("/risks");
  if (projectKey) revalidatePath(`/projects/${projectKey}`);
}

export async function createRisk(input: {
  risk: string;
  description?: string;
  probability: number;
  impact: number;
  mitigation?: string;
  dueDate?: Date | null;
  projectId?: string | null;
}) {
  const user = await getCurrentUser();
  const project = input.projectId ? await db.project.findUnique({ where: { id: input.projectId } }) : null;
  const risk = await db.risk.create({
    data: {
      risk: input.risk,
      description: input.description,
      probability: input.probability,
      impact: input.impact,
      mitigation: input.mitigation,
      dueDate: input.dueDate,
      projectId: input.projectId ?? null,
      ownerId: user.id,
    },
  });
  await logActivity({ entityType: "Risk", entityId: risk.id, action: "created", message: `Logged risk "${risk.risk}"`, projectId: risk.projectId ?? undefined });
  revalidateRiskViews(project?.key);
  return risk;
}

export async function updateRiskStatus(riskId: string, status: RiskStatus) {
  const before = await db.risk.findUniqueOrThrow({ where: { id: riskId }, include: { project: true } });
  const updated = await db.risk.update({ where: { id: riskId }, data: { status } });
  await logActivity({ entityType: "Risk", entityId: riskId, action: "status_changed", message: `moved risk "${before.risk}" to ${status}`, projectId: before.projectId ?? undefined });
  revalidateRiskViews(before.project?.key);
  return updated;
}
