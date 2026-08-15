"use server";

import { db } from "@/lib/db";

export async function exportAllDataJson() {
  const [
    users, projects, initiatives, workstreams, tasks, people, vendors,
    followUps, waitingFor, meetings, risks, releases, documents,
    incidents,
  ] = await Promise.all([
    db.user.findMany(),
    db.project.findMany(),
    db.initiative.findMany(),
    db.workstream.findMany(),
    db.task.findMany(),
    db.person.findMany(),
    db.vendor.findMany(),
    db.followUp.findMany(),
    db.waitingForItem.findMany(),
    db.meeting.findMany({ include: { participants: true, actionItems: true } }),
    db.risk.findMany(),
    db.release.findMany({ include: { projects: true } }),
    db.document.findMany(),
    db.incident.findMany(),
  ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      users, projects, initiatives, workstreams, tasks, people, vendors,
      followUps, waitingFor, meetings, risks, releases, documents,
      incidents,
    },
    null,
    2
  );
}

export async function exportTasksCsv() {
  const tasks = await db.task.findMany({ include: { project: true, assignee: true } });
  const header = ["taskKey", "title", "type", "status", "priority", "project", "assignee", "dueDate", "createdAt"];
  const rows = tasks.map((t) =>
    [t.taskKey, csvEscape(t.title), t.type, t.status, t.priority, t.project?.name ?? "", t.assignee?.name ?? "", t.dueDate?.toISOString() ?? "", t.createdAt.toISOString()].join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
