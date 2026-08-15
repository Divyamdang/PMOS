import { db } from "@/lib/db";
import { DocumentsView } from "@/components/documents/documents-view";

export default async function DocumentsPage() {
  const [documents, projects] = await Promise.all([
    db.document.findMany({ include: { project: true }, orderBy: { updatedAt: "desc" } }),
    db.project.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
  ]);
  return <DocumentsView documents={documents} projects={projects} />;
}
