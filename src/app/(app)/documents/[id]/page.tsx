import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DocumentEditor } from "@/components/documents/document-editor";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id }, include: { project: true } });
  if (!doc) notFound();
  return <DocumentEditor doc={doc} />;
}
