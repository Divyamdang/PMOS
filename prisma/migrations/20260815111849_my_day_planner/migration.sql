-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TASK',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'P2',
    "projectId" TEXT,
    "workstreamId" TEXT,
    "assigneeId" TEXT,
    "reporterId" TEXT,
    "parentTaskId" TEXT,
    "dueDate" DATETIME,
    "startDate" DATETIME,
    "estimate" REAL,
    "labels" TEXT,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "planBucket" TEXT,
    "planDate" DATETIME,
    "planOrder" INTEGER NOT NULL DEFAULT 0,
    "paymentGateway" TEXT,
    "paymentMethod" TEXT,
    "network" TEXT,
    "transactionType" TEXT,
    "merchant" TEXT,
    "environment" TEXT,
    "errorCode" TEXT,
    "failureReason" TEXT,
    "transactionVolume" REAL,
    "successRate" REAL,
    "personId" TEXT,
    "vendorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_workstreamId_fkey" FOREIGN KEY ("workstreamId") REFERENCES "Workstream" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assigneeId", "completedAt", "createdAt", "description", "dueDate", "environment", "errorCode", "estimate", "failureReason", "id", "isPersonal", "labels", "merchant", "network", "parentTaskId", "paymentGateway", "paymentMethod", "personId", "priority", "projectId", "reporterId", "startDate", "status", "successRate", "taskKey", "title", "transactionType", "transactionVolume", "type", "updatedAt", "vendorId", "workstreamId") SELECT "assigneeId", "completedAt", "createdAt", "description", "dueDate", "environment", "errorCode", "estimate", "failureReason", "id", "isPersonal", "labels", "merchant", "network", "parentTaskId", "paymentGateway", "paymentMethod", "personId", "priority", "projectId", "reporterId", "startDate", "status", "successRate", "taskKey", "title", "transactionType", "transactionVolume", "type", "updatedAt", "vendorId", "workstreamId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE UNIQUE INDEX "Task_taskKey_key" ON "Task"("taskKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
