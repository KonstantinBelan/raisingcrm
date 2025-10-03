-- AlterTable
ALTER TABLE "public"."tasks" ALTER COLUMN "estimatedHours" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "actualHours" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."time_sessions" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "time_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_sessions_userId_taskId_idx" ON "public"."time_sessions"("userId", "taskId");

-- CreateIndex
CREATE INDEX "time_sessions_taskId_startTime_idx" ON "public"."time_sessions"("taskId", "startTime");

-- CreateIndex
CREATE INDEX "clients_userId_idx" ON "public"."clients"("userId");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "public"."clients"("email");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "public"."payments"("userId", "status");

-- CreateIndex
CREATE INDEX "payments_projectId_idx" ON "public"."payments"("projectId");

-- CreateIndex
CREATE INDEX "payments_userId_dueDate_idx" ON "public"."payments"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "payments_status_dueDate_idx" ON "public"."payments"("status", "dueDate");

-- CreateIndex
CREATE INDEX "projects_userId_status_idx" ON "public"."projects"("userId", "status");

-- CreateIndex
CREATE INDEX "projects_userId_createdAt_idx" ON "public"."projects"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "projects_clientId_idx" ON "public"."projects"("clientId");

-- CreateIndex
CREATE INDEX "projects_deadline_idx" ON "public"."projects"("deadline");

-- CreateIndex
CREATE INDEX "reminders_userId_scheduledAt_idx" ON "public"."reminders"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "reminders_sent_scheduledAt_idx" ON "public"."reminders"("sent", "scheduledAt");

-- CreateIndex
CREATE INDEX "tasks_userId_status_idx" ON "public"."tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "public"."tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_userId_deadline_idx" ON "public"."tasks"("userId", "deadline");

-- CreateIndex
CREATE INDEX "tasks_parentTaskId_idx" ON "public"."tasks"("parentTaskId");

-- CreateIndex
CREATE INDEX "tasks_userId_createdAt_idx" ON "public"."tasks"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."time_sessions" ADD CONSTRAINT "time_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_sessions" ADD CONSTRAINT "time_sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
