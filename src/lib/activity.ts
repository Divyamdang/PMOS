import { db } from "@/lib/db";

/** Every meaningful mutation writes an event here — surfaced in project/task
 * activity feeds. See master prompt Section 5, "Activity log". */
export async function logActivity(params: {
  entityType: "Task" | "Project" | "Risk" | "Decision" | "FollowUp" | "WaitingForItem" | "Meeting";
  entityId: string;
  action: string;
  message: string;
  fromValue?: string | null;
  toValue?: string | null;
  taskId?: string;
  projectId?: string;
  actorId?: string;
}) {
  await db.activityEvent.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      message: params.message,
      fromValue: params.fromValue ?? null,
      toValue: params.toValue ?? null,
      taskId: params.taskId,
      projectId: params.projectId,
      actorId: params.actorId,
    },
  });
}
