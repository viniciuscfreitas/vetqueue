-- Create PaymentStatus enum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED');

-- Alter queue_entries table
ALTER TABLE "queue_entries"
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paymentAmount" DECIMAL(10,2),
  ADD COLUMN "paymentReceivedById" TEXT,
  ADD COLUMN "paymentReceivedAt" TIMESTAMP,
  ADD COLUMN "paymentNotes" TEXT;

-- Add foreign key
ALTER TABLE "queue_entries"
  ADD CONSTRAINT "queue_entries_paymentReceivedById_fkey" FOREIGN KEY ("paymentReceivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "queue_entries_paymentStatus_idx" ON "queue_entries"("paymentStatus");
CREATE INDEX "queue_entries_paymentReceivedById_idx" ON "queue_entries"("paymentReceivedById");
