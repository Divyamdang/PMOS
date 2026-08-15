import { differenceInCalendarDays, format, formatDistanceToNowStrict, isPast, isToday } from "date-fns";

export function formatDate(date: Date | string | null | undefined, pattern = "MMM d") {
  if (!date) return null;
  return format(new Date(date), pattern);
}

export function dueLabel(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return "Today";
  const days = differenceInCalendarDays(d, new Date());
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 1) return "Tomorrow";
  if (days <= 6) return `In ${days}d`;
  return format(d, "MMM d");
}

export function isOverdue(date: Date | string | null | undefined) {
  if (!date) return false;
  const d = new Date(date);
  return isPast(d) && !isToday(d);
}

export function daysSince(date: Date | string | null | undefined) {
  if (!date) return null;
  return differenceInCalendarDays(new Date(), new Date(date));
}

export function timeAgo(date: Date | string | null | undefined) {
  if (!date) return "";
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export function formatMoney(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}
