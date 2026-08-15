import { db } from "@/lib/db";
import { MetricsView } from "@/components/metrics/metrics-view";

export default async function MetricsPage() {
  const [metrics, projects] = await Promise.all([
    db.metric.findMany({ include: { project: true }, orderBy: { date: "asc" } }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);

  const groups = new Map<string, typeof metrics>();
  for (const m of metrics) {
    const arr = groups.get(m.name) ?? [];
    arr.push(m);
    groups.set(m.name, arr);
  }

  return <MetricsView groups={Array.from(groups.entries())} projects={projects} />;
}
