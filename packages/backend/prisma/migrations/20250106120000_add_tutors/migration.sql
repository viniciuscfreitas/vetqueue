-- CreateTable
CREATE TABLE "tutors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "cpfCnpj" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutors_name_idx" ON "tutors"("name");

-- CreateIndex
CREATE INDEX "tutors_phone_idx" ON "tutors"("phone");

-- CreateIndex
CREATE INDEX "tutors_cpfCnpj_idx" ON "tutors"("cpfCnpj");

