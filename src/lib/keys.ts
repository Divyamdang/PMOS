import { db } from "@/lib/db";

/** Generates the next sequential key for a project (PGR-114) or, for
 * personal/unassigned tasks, a generic "PM-" prefix. */
export async function nextTaskKey(projectKey?: string | null) {
  const prefix = projectKey ?? "PM";
  const count = await db.task.count({ where: { taskKey: { startsWith: `${prefix}-` } } });
  return `${prefix}-${100 + count}`;
}

export async function nextIncidentKey() {
  const count = await db.incident.count();
  return `INC-${100 + count}`;
}
