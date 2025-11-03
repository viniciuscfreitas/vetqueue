-- AlterTable
ALTER TABLE "patients" ADD COLUMN "microchip" TEXT,
ADD COLUMN "color" TEXT,
ADD COLUMN "currentWeight" DOUBLE PRECISION,
ADD COLUMN "allergies" TEXT,
ADD COLUMN "ongoingMedications" TEXT,
ADD COLUMN "temperament" TEXT,
ADD COLUMN "neutered" BOOLEAN DEFAULT false,
ADD COLUMN "photoUrl" TEXT,
ADD COLUMN "tutorCpfCnpj" TEXT,
ADD COLUMN "tutorAddress" TEXT;

-- CreateIndex
CREATE INDEX "patients_microchip_idx" ON "patients"("microchip");

