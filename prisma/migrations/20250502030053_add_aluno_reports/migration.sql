/*
  Warnings:

  - You are about to drop the `Relatorio` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('PESO', 'IMC', 'MEDIDA_BRACO', 'MEDIDA_PERNA', 'MEDIDA_PEITO', 'MEDIDA_CINTURA', 'MEDIDA_QUADRIL', 'PERCENTUAL_GORDURA', 'MASSA_MUSCULAR');

-- DropForeignKey
ALTER TABLE "Relatorio" DROP CONSTRAINT "Relatorio_aluno_id_fkey";

-- DropForeignKey
ALTER TABLE "Relatorio" DROP CONSTRAINT "Relatorio_personal_id_fkey";

-- DropTable
DROP TABLE "Relatorio";

-- DropEnum
DROP TYPE "TipoMetrica";

-- CreateTable
CREATE TABLE "AlunoReport" (
    "id" SERIAL NOT NULL,
    "type" "ReportType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aluno_id" INTEGER NOT NULL,
    "personal_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlunoReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AlunoReport" ADD CONSTRAINT "AlunoReport_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "PreferenciasAluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoReport" ADD CONSTRAINT "AlunoReport_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "PreferenciasPersonal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
