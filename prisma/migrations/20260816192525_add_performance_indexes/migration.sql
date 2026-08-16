-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "ActivityEvent_projectId_createdAt_idx" ON "ActivityEvent"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_taskId_idx" ON "ActivityEvent"("taskId");

-- CreateIndex
CREATE INDEX "ActivityEvent_createdAt_idx" ON "ActivityEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "FollowUp_status_followUpDate_idx" ON "FollowUp"("status", "followUpDate");

-- CreateIndex
CREATE INDEX "FollowUp_personId_idx" ON "FollowUp"("personId");

-- CreateIndex
CREATE INDEX "FollowUp_vendorId_idx" ON "FollowUp"("vendorId");

-- CreateIndex
CREATE INDEX "InboxItem_userId_converted_idx" ON "InboxItem"("userId", "converted");

-- CreateIndex
CREATE INDEX "Meeting_date_idx" ON "Meeting"("date");

-- CreateIndex
CREATE INDEX "Meeting_projectId_idx" ON "Meeting"("projectId");

-- CreateIndex
CREATE INDEX "Project_archived_status_idx" ON "Project"("archived", "status");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "Project_initiativeId_idx" ON "Project"("initiativeId");

-- CreateIndex
CREATE INDEX "Project_updatedAt_idx" ON "Project"("updatedAt");

-- CreateIndex
CREATE INDEX "Risk_projectId_status_idx" ON "Risk"("projectId", "status");

-- CreateIndex
CREATE INDEX "Risk_ownerId_idx" ON "Risk"("ownerId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_idx" ON "Task"("assigneeId", "status");

-- CreateIndex
CREATE INDEX "Task_status_dueDate_idx" ON "Task"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- CreateIndex
CREATE INDEX "Task_workstreamId_idx" ON "Task"("workstreamId");

-- CreateIndex
CREATE INDEX "Task_reporterId_idx" ON "Task"("reporterId");

-- CreateIndex
CREATE INDEX "Task_personId_idx" ON "Task"("personId");

-- CreateIndex
CREATE INDEX "Task_vendorId_idx" ON "Task"("vendorId");

-- CreateIndex
CREATE INDEX "Task_planDate_idx" ON "Task"("planDate");

-- CreateIndex
CREATE INDEX "WaitingForItem_status_followUpDate_idx" ON "WaitingForItem"("status", "followUpDate");

-- CreateIndex
CREATE INDEX "WaitingForItem_personId_idx" ON "WaitingForItem"("personId");

-- CreateIndex
CREATE INDEX "WaitingForItem_vendorId_idx" ON "WaitingForItem"("vendorId");

-- CreateIndex
CREATE INDEX "WaitingForItem_projectId_idx" ON "WaitingForItem"("projectId");
