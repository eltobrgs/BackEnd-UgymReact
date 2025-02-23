-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USUARIO_COMUM', 'PERSONAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USUARIO_COMUM';

-- CreateTable
CREATE TABLE "Personal" (
    "id" SERIAL NOT NULL,
    "cref" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "specializations" TEXT[],
    "yearsOfExperience" TEXT NOT NULL,
    "workSchedule" TEXT NOT NULL,
    "certifications" TEXT[],
    "biography" TEXT NOT NULL,
    "workLocation" TEXT NOT NULL,
    "pricePerHour" TEXT NOT NULL,
    "languages" TEXT[],
    "instagram" TEXT,
    "linkedin" TEXT,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Personal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Personal_cref_key" ON "Personal"("cref");

-- CreateIndex
CREATE UNIQUE INDEX "Personal_user_id_key" ON "Personal"("user_id");

-- AddForeignKey
ALTER TABLE "Personal" ADD CONSTRAINT "Personal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
