-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "currentRoomId" TEXT,
ADD COLUMN IF NOT EXISTS "roomCheckedInAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_currentRoomId_idx" ON "users"("currentRoomId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_currentRoomId_fkey" FOREIGN KEY ("currentRoomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

