-- CreateTable
CREATE TABLE "queue_entries" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "tutorName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_entries_status_idx" ON "queue_entries"("status");

-- CreateIndex
CREATE INDEX "queue_entries_priority_createdAt_idx" ON "queue_entries"("priority", "createdAt");

-- CreateIndex
CREATE INDEX "queue_entries_serviceType_idx" ON "queue_entries"("serviceType");

