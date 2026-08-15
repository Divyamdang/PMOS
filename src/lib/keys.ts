import { db } from "@/lib/db";

/** Generates the next sequential key for a project (PGR-114) or, for
 * personal/unassigned tasks, a generic "PM-" prefix. Uses the highest
 * existing numeric suffix rather than a row count — a count-based approach
 * collides as soon as there's any gap in the sequence (a deleted task, or
 * non-contiguous seeding), since it can re-derive a number that's already
 * taken. */
export async function nextTaskKey(projectKey?: string | null) {
  const prefix = projectKey ?? "PM";
  const existing = await db.task.findMany({
    where: { taskKey: { startsWith: `${prefix}-` } },
    select: { taskKey: true },
  });
  const max = existing.reduce((acc, { taskKey }) => {
    const n = Number(taskKey.slice(prefix.length + 1));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 99);
  return `${prefix}-${max + 1}`;
}

export async function nextIncidentKey() {
  const count = await db.incident.count();
  return `INC-${100 + count}`;
}
