import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { MyWorkView } from "@/components/my-work/my-work-view";

export default async function MyWorkPage() {
  // Scoped to the signed-in user. Without the assignee filter this listed
  // every teammate's own-work tasks on a page called "My Work" — harmless
  // with one user, wrong the moment the team grows.
  const userId = await getCurrentUserId();
  const tasks = await db.task.findMany({
    where: { assigneeId: userId, isPersonal: true, status: { not: "DONE" } },
    include: { project: true },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });
  return <MyWorkView tasks={tasks} />;
}
