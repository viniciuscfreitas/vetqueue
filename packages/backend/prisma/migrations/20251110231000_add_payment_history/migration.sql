-- Add paymentHistory column to queue_entries for storing payment timeline as JSON.
ALTER TABLE "queue_entries"
ADD COLUMN "paymentHistory" JSONB;

