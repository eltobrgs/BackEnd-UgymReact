/*
  Warnings:

  - You are about to drop the `RelatorioAluno` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RelatorioAluno" DROP CONSTRAINT "RelatorioAluno_aluno_id_fkey";

-- DropForeignKey
ALTER TABLE "RelatorioAluno" DROP CONSTRAINT "RelatorioAluno_personal_id_fkey";

-- DropTable
DROP TABLE "RelatorioAluno";

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "aluno_id" INTEGER NOT NULL,
    "personal_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportData" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "PreferenciasAluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "PreferenciasPersonal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportData" ADD CONSTRAINT "ReportData_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
