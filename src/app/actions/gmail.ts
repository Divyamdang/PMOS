"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { nextTaskKey } from "@/lib/keys";
import { logActivity } from "@/lib/activity";
import { listRecentGmailMessages, type GmailMessage } from "@/lib/google/gmail";
import { revalidatePath } from "next/cache";
import type { InboxConversion, TaskType } from "@/generated/prisma";

type GmailResult = { ok: true; messages: GmailMessage[] } | { ok: false; reason: string };

export async function fetchGmailMessages(): Promise<GmailResult> {
  const user = await getCurrentUser();
  try {
    const messages = await listRecentGmailMessages(user.id);
    return { ok: true, messages };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Couldn't reach Gmail." };
  }
}

const CONVERSION_TASK_TYPE: Record<InboxConversion, TaskType> = {
  TASK: "TASK",
  FOLLOW_UP: "FOLLOW_UP",
  REMINDER: "REMINDER",
  MEETING: "MEETING",
  RESEARCH: "RESEARCH",
  IDEA: "IDEA",
};

/** Converts a Gmail message straight into a task — same shape as converting
 * a manually-captured Inbox item, just sourced from an email instead. */
export async function convertGmailMessage(message: GmailMessage, conversion: InboxConversion) {
  const user = await getCurrentUser();
  const taskKey = await nextTaskKey(null);
  const task = await db.task.create({
    data: {
      taskKey,
      title: message.subject,
      description: `From: ${message.from}\n\n${message.snippet}`,
      type: CONVERSION_TASK_TYPE[conversion],
      isPersonal: true,
      assigneeId: user.id,
      reporterId: user.id,
    },
  });
  await logActivity({ entityType: "Task", entityId: task.id, action: "created", message: `Created ${taskKey} from Gmail`, taskId: task.id });
  revalidatePath("/inbox");
  revalidatePath("/my-work");
  revalidatePath("/dashboard");
  return task;
}
