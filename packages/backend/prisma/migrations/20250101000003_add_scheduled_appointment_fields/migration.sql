-- AlterTable
ALTER TABLE "queue_entries" ADD COLUMN IF NOT EXISTS "hasScheduledAppointment" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "queue_entries" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

