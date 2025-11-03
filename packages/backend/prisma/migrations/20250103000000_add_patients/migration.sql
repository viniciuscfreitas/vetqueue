-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "breed" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "tutorName" TEXT NOT NULL,
    "tutorPhone" TEXT,
    "tutorEmail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_name_idx" ON "patients"("name");

-- CreateIndex
CREATE INDEX "patients_tutorName_idx" ON "patients"("tutorName");

-- CreateIndex
CREATE INDEX "patients_tutorPhone_idx" ON "patients"("tutorPhone");

