import { db } from "@/lib/db";
import { MyWorkView } from "@/components/my-work/my-work-view";

export default async function MyWorkPage() {
  const tasks = await db.task.findMany({
    where: { isPersonal: true, status: { not: "DONE" } },
    include: { project: true },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });
  return <MyWorkView tasks={tasks} />;
}
