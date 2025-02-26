/*
  Warnings:

  - The values [USUARIO_COMUM] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Personal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Preferences` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ALUNO', 'PERSONAL', 'ACADEMIA');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ALUNO';
COMMIT;

-- DropForeignKey
ALTER TABLE "Personal" DROP CONSTRAINT "Personal_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Preferences" DROP CONSTRAINT "Preferences_personalId_fkey";

-- DropForeignKey
ALTER TABLE "Preferences" DROP CONSTRAINT "Preferences_user_id_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ALUNO';

-- DropTable
DROP TABLE "Personal";

-- DropTable
DROP TABLE "Preferences";

-- CreateTable
CREATE TABLE "PreferenciasAluno" (
    "id" SERIAL NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "healthCondition" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "height" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "medicalConditions" TEXT NOT NULL,
    "physicalLimitations" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "personalId" INTEGER,

    CONSTRAINT "PreferenciasAluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenciasPersonal" (
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

    CONSTRAINT "PreferenciasPersonal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Academia" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "horarioFuncionamento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "comodidades" TEXT[],
    "planos" TEXT[],
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Academia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciasAluno_user_id_key" ON "PreferenciasAluno"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciasPersonal_cref_key" ON "PreferenciasPersonal"("cref");

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciasPersonal_user_id_key" ON "PreferenciasPersonal"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Academia_cnpj_key" ON "Academia"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Academia_user_id_key" ON "Academia"("user_id");

-- AddForeignKey
ALTER TABLE "PreferenciasAluno" ADD CONSTRAINT "PreferenciasAluno_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciasAluno" ADD CONSTRAINT "PreferenciasAluno_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "PreferenciasPersonal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciasPersonal" ADD CONSTRAINT "PreferenciasPersonal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Academia" ADD CONSTRAINT "Academia_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
