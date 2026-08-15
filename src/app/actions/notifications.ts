"use server";

import { getNotifications } from "@/lib/queries/notifications";

export async function fetchNotifications() {
  return getNotifications();
}
