-- AlterTable
ALTER TABLE "patients" ADD COLUMN "tutorId" TEXT;

-- CreateIndex
CREATE INDEX "patients_tutorId_idx" ON "patients"("tutorId");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

