"use server";

import { db } from "@/lib/db";
import fs from "node:fs/promises";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
const BACKUP_DIR = path.join(process.cwd(), "prisma", "backups");

export async function exportAllDataJson() {
  const [
    users, projects, initiatives, workstreams, tasks, people, vendors,
    followUps, waitingFor, meetings, decisions, risks, releases, documents,
    metrics, incidents,
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
    db.decision.findMany(),
    db.risk.findMany(),
    db.release.findMany({ include: { projects: true } }),
    db.document.findMany(),
    db.metric.findMany(),
    db.incident.findMany(),
  ]);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      users, projects, initiatives, workstreams, tasks, people, vendors,
      followUps, waitingFor, meetings, decisions, risks, releases, documents,
      metrics, incidents,
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

export async function createBackup() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUP_DIR, `pmos-backup-${stamp}.db`);
  await fs.copyFile(DB_PATH, dest);
  return { fileName: path.basename(dest), createdAt: stamp };
}

export async function listBackups() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const files = await fs.readdir(BACKUP_DIR);
  const stats = await Promise.all(
    files
      .filter((f) => f.endsWith(".db"))
      .map(async (f) => {
        const stat = await fs.stat(path.join(BACKUP_DIR, f));
        return { fileName: f, size: stat.size, createdAt: stat.mtime.toISOString() };
      })
  );
  return stats.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function restoreBackup(fileName: string) {
  const safeName = path.basename(fileName);
  const src = path.join(BACKUP_DIR, safeName);
  await fs.access(src);
  // safety copy of current state before overwriting
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const preRestoreStamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.copyFile(DB_PATH, path.join(BACKUP_DIR, `pre-restore-${preRestoreStamp}.db`));
  await fs.copyFile(src, DB_PATH);
}
