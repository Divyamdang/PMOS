"use server";

import { db } from "@/lib/db";
import { isAIEnabled } from "@/lib/ai/client";
import {
  draftTaskFromText,
  draftActionItemsFromNotes,
  summarizeProject,
  draftWeeklyUpdate,
  synthesizeForgotten,
  draftPRD,
  translateSearchQuery,
  type TaskDraft,
  type ActionItemDraft,
  type PRDDraft,
  type NLSearchFilter,
} from "@/lib/ai/service";

export async function checkAIEnabled() {
  return isAIEnabled();
}

type AIResult<T> = { ok: true; data: T } | { ok: false; reason: string };

const UNAVAILABLE = "AI features are unavailable until an API key is configured.";

async function guarded<T>(fn: () => Promise<T>): Promise<AIResult<T>> {
  if (!isAIEnabled()) return { ok: false, reason: UNAVAILABLE };
  try {
    return { ok: true, data: await fn() };
  } catch {
    return { ok: false, reason: "AI request failed. Try again in a moment." };
  }
}

export async function aiDraftTask(text: string): Promise<AIResult<TaskDraft>> {
  return guarded(async () => {
    const projects = await db.project.findMany({ where: { archived: false }, select: { key: true } });
    return draftTaskFromText(text, projects.map((p) => p.key));
  });
}

export async function aiDraftActionItems(meetingId: string): Promise<AIResult<ActionItemDraft[]>> {
  return guarded(async () => {
    const meeting = await db.meeting.findUniqueOrThrow({ where: { id: meetingId }, include: { participants: { include: { person: true } } } });
    if (!meeting.notes) throw new Error("This meeting has no notes yet.");
    return draftActionItemsFromNotes(meeting.notes, meeting.participants.map((p) => p.person.name));
  });
}

export async function aiSummarizeProject(projectId: string): Promise<AIResult<string>> {
  return guarded(async () => {
    const project = await db.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        tasks: true,
        risks: { where: { status: { in: ["MONITORING", "ESCALATED"] } } },
        waitingFor: { where: { status: "WAITING" } },
      },
    });
    const done = project.tasks.filter((t) => t.status === "DONE").length;
    const inProgress = project.tasks.filter((t) => t.status === "IN_PROGRESS").map((t) => t.title);
    const blocked = project.tasks.filter((t) => t.status === "BLOCKED").map((t) => t.title);
    const context = [
      `Project: ${project.name} (${project.key})`,
      `Status: ${project.status}, Health: ${project.health}`,
      `Progress: ${done}/${project.tasks.length} tasks done`,
      `In progress: ${inProgress.join(", ") || "none"}`,
      `Blocked: ${blocked.join(", ") || "none"}`,
      `Risks: ${project.risks.map((r) => r.risk).join(", ") || "none"}`,
      `Waiting for: ${project.waitingFor.map((w) => `${w.what} (${w.who})`).join(", ") || "none"}`,
      `Target date: ${project.targetDate?.toISOString().slice(0, 10) ?? "none"}`,
    ].join("\n");
    return summarizeProject(context);
  });
}

export async function aiWeeklyUpdate(): Promise<AIResult<string>> {
  return guarded(async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [shipped, inProgress, blocked, risks] = await Promise.all([
      db.task.findMany({ where: { status: "DONE", completedAt: { gte: since } }, include: { project: true } }),
      db.task.findMany({ where: { status: "IN_PROGRESS" }, include: { project: true } }),
      db.task.findMany({ where: { status: "BLOCKED" }, include: { project: true } }),
      db.risk.findMany({ where: { status: { in: ["MONITORING", "ESCALATED"] } } }),
    ]);
    const context = [
      `Shipped this week: ${shipped.map((t) => `${t.title} (${t.project?.name ?? "personal"})`).join("; ") || "none"}`,
      `In progress: ${inProgress.map((t) => `${t.title} (${t.project?.name ?? "personal"})`).join("; ") || "none"}`,
      `Blocked: ${blocked.map((t) => `${t.title} (${t.project?.name ?? "personal"})`).join("; ") || "none"}`,
      `Open risks: ${risks.map((r) => r.risk).join("; ") || "none"}`,
    ].join("\n");
    return draftWeeklyUpdate(context);
  });
}

export async function aiWhatAmIForgetting(): Promise<AIResult<{ synthesis: string | null; items: { label: string; href: string }[] }>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [overdueTasks, blockedTasks, followUpsDue, waitingFor, staleProjects, risksDue] = await Promise.all([
    db.task.findMany({ where: { status: { not: "DONE" }, dueDate: { lt: today } }, take: 10 }),
    db.task.findMany({ where: { status: "BLOCKED" }, take: 10 }),
    db.followUp.findMany({ where: { followUpDate: { lte: today }, status: { notIn: ["RESOLVED", "CLOSED"] } }, take: 10 }),
    db.waitingForItem.findMany({ where: { status: "WAITING", followUpDate: { lte: today } }, take: 10 }),
    db.project.findMany({ where: { archived: false, status: { notIn: ["COMPLETED", "BACKLOG"] }, updatedAt: { lt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }, take: 10 }),
    db.risk.findMany({ where: { status: { in: ["MONITORING", "ESCALATED"] }, dueDate: { lte: today } }, take: 10 }),
  ]);

  const items = [
    ...overdueTasks.map((t) => ({ label: `Overdue: ${t.taskKey} ${t.title}`, href: "/tasks?filter=overdue" })),
    ...blockedTasks.map((t) => ({ label: `Blocked: ${t.taskKey} ${t.title}`, href: "/tasks?filter=blocked" })),
    ...followUpsDue.map((f) => ({ label: `Follow-up due: ${f.topic}`, href: "/follow-ups" })),
    ...waitingFor.map((w) => ({ label: `Waiting-for due: ${w.what}`, href: "/waiting-for" })),
    ...staleProjects.map((p) => ({ label: `Stale project: ${p.name} (no update in 14+ days)`, href: `/projects/${p.key}` })),
    ...risksDue.map((r) => ({ label: `Risk due: ${r.risk}`, href: "/risks" })),
  ];

  if (!isAIEnabled()) {
    return { ok: true, data: { synthesis: null, items } };
  }
  try {
    const context = items.map((i) => i.label).join("\n") || "Nothing outstanding.";
    const synthesis = await synthesizeForgotten(context);
    return { ok: true, data: { synthesis, items } };
  } catch {
    return { ok: true, data: { synthesis: null, items } };
  }
}

export async function aiDraftPRD(idea: string): Promise<AIResult<PRDDraft>> {
  return guarded(() => draftPRD(idea));
}

export async function aiSearch(query: string): Promise<AIResult<NLSearchFilter>> {
  return guarded(async () => {
    const [projects, users] = await Promise.all([
      db.project.findMany({ where: { archived: false }, select: { name: true } }),
      db.user.findMany({ select: { name: true } }),
    ]);
    return translateSearchQuery(query, projects.map((p) => p.name), users.map((u) => u.name));
  });
}
