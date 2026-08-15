"use server";

import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { TASK_STATUS_META, PRIORITY_META, TASK_TYPE_META } from "@/lib/domain";

/** Full tracker export — every field a PM would want in a spreadsheet
 * (status, assignee, priority, dates, project) plus the fintech-specific
 * fields when a task has them set. Returns a base64 string since server
 * actions can't stream binary buffers straight to the browser. */
export async function exportTasksToExcel(): Promise<string> {
  const tasks = await db.task.findMany({
    include: { project: true, assignee: true, reporter: true, workstream: true, subtasks: true },
    orderBy: [{ project: { key: "asc" } }, { taskKey: "asc" }],
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WTS";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Tasks", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Key", key: "key", width: 12 },
    { header: "Title", key: "title", width: 42 },
    { header: "Type", key: "type", width: 14 },
    { header: "Status", key: "status", width: 14 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Project", key: "project", width: 24 },
    { header: "Workstream", key: "workstream", width: 18 },
    { header: "Assignee", key: "assignee", width: 18 },
    { header: "Reporter", key: "reporter", width: 18 },
    { header: "Due Date", key: "dueDate", width: 14 },
    { header: "Start Date", key: "startDate", width: 14 },
    { header: "Estimate", key: "estimate", width: 10 },
    { header: "Labels", key: "labels", width: 20 },
    { header: "Subtasks Done", key: "subtasksDone", width: 14 },
    { header: "Subtasks Total", key: "subtasksTotal", width: 14 },
    { header: "Personal", key: "personal", width: 10 },
    { header: "Payment Gateway", key: "paymentGateway", width: 16 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Network", key: "network", width: 12 },
    { header: "Merchant", key: "merchant", width: 16 },
    { header: "Environment", key: "environment", width: 14 },
    { header: "Error Code", key: "errorCode", width: 14 },
    { header: "Success Rate", key: "successRate", width: 14 },
    { header: "Created At", key: "createdAt", width: 14 },
    { header: "Completed At", key: "completedAt", width: 14 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4C7EF0" } };
  headerRow.height = 20;

  for (const t of tasks) {
    sheet.addRow({
      key: t.taskKey,
      title: t.title,
      type: TASK_TYPE_META[t.type]?.label ?? t.type,
      status: TASK_STATUS_META[t.status]?.label ?? t.status,
      priority: PRIORITY_META[t.priority]?.label ?? t.priority,
      project: t.project?.name ?? "",
      workstream: t.workstream?.name ?? "",
      assignee: t.assignee?.name ?? "",
      reporter: t.reporter?.name ?? "",
      dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
      startDate: t.startDate ? t.startDate.toISOString().slice(0, 10) : "",
      estimate: t.estimate ?? "",
      labels: t.labels ?? "",
      subtasksDone: t.subtasks.filter((s) => s.status === "DONE").length,
      subtasksTotal: t.subtasks.length,
      personal: t.isPersonal ? "Yes" : "No",
      paymentGateway: t.paymentGateway ?? "",
      paymentMethod: t.paymentMethod ?? "",
      network: t.network ?? "",
      merchant: t.merchant ?? "",
      environment: t.environment ?? "",
      errorCode: t.errorCode ?? "",
      successRate: t.successRate ?? "",
      createdAt: t.createdAt.toISOString().slice(0, 10),
      completedAt: t.completedAt ? t.completedAt.toISOString().slice(0, 10) : "",
    });
  }

  sheet.autoFilter = { from: "A1", to: `${sheet.getColumn(sheet.columns.length).letter}1` };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
}
