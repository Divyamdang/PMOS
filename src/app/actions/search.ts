"use server";

import { db } from "@/lib/db";

export async function searchEverything(query: string) {
  const q = query.trim();
  if (q.length < 2) return null;

  const [tasks, projects, people, vendors, documents, meetings, risks] = await Promise.all([
    db.task.findMany({ where: { OR: [{ title: { contains: q } }, { taskKey: { contains: q } }] }, take: 5 }),
    db.project.findMany({ where: { OR: [{ name: { contains: q } }, { key: { contains: q } }] }, take: 5 }),
    db.person.findMany({ where: { name: { contains: q } }, take: 5 }),
    db.vendor.findMany({ where: { name: { contains: q } }, take: 5 }),
    db.document.findMany({ where: { title: { contains: q } }, take: 5 }),
    db.meeting.findMany({ where: { title: { contains: q } }, take: 5 }),
    db.risk.findMany({ where: { risk: { contains: q } }, take: 5 }),
  ]);

  return { tasks, projects, people, vendors, documents, meetings, risks };
}

export type SearchResults = NonNullable<Awaited<ReturnType<typeof searchEverything>>>;
