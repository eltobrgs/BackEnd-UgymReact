/*
  Warnings:

  - You are about to drop the `AlunoReport` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AlunoReport" DROP CONSTRAINT "AlunoReport_aluno_id_fkey";

-- DropForeignKey
ALTER TABLE "AlunoReport" DROP CONSTRAINT "AlunoReport_personal_id_fkey";

-- DropTable
DROP TABLE "AlunoReport";

-- DropEnum
DROP TYPE "ReportType";

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    "aluno_id" INTEGER NOT NULL,
    "personal_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "PreferenciasAluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "PreferenciasPersonal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
