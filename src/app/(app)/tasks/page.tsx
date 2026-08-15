import { getAllTasksForBoard } from "@/lib/queries/tasks";
import { TasksView } from "@/components/tasks/tasks-view";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; filter?: string }>;
}) {
  const params = await searchParams;
  const { tasks, projects } = await getAllTasksForBoard();

  return <TasksView tasks={tasks} projects={projects} openNewOnLoad={params.new === "1"} initialFilter={params.filter} />;
}
