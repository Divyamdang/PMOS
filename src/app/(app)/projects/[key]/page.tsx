import { notFound } from "next/navigation";
import { getProjectByKey } from "@/lib/queries/project";
import { ProjectCockpit } from "@/components/projects/project-cockpit";

export default async function ProjectCockpitPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const data = await getProjectByKey(key);
  if (!data) notFound();
  return <ProjectCockpit data={data} />;
}
