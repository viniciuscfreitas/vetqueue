-- AlterTable
ALTER TABLE "queue_entries" ADD COLUMN "patientId" TEXT;

-- CreateIndex
CREATE INDEX "queue_entries_patientId_idx" ON "queue_entries"("patientId");

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

