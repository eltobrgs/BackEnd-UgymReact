/*
  Warnings:

  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReportData` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoMetrica" AS ENUM ('PESO', 'GORDURA_CORPORAL', 'MASSA_MUSCULAR', 'AGUA_CORPORAL', 'IMC', 'MEDIDA_BRACO', 'MEDIDA_PEITO', 'MEDIDA_CINTURA', 'MEDIDA_QUADRIL', 'MEDIDA_COXA', 'MEDIDA_PANTURRILHA', 'PERFORMANCE_FORCA', 'PERFORMANCE_RESISTENCIA', 'PERFORMANCE_AGILIDADE', 'PERFORMANCE_FLEXIBILIDADE', 'PERFORMANCE_VELOCIDADE', 'PERFORMANCE_EQUILIBRIO');

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_aluno_id_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_personal_id_fkey";

-- DropForeignKey
ALTER TABLE "ReportData" DROP CONSTRAINT "ReportData_report_id_fkey";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "ReportData";

-- CreateTable
CREATE TABLE "Relatorio" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoMetrica" NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "observacao" TEXT,
    "aluno_id" INTEGER NOT NULL,
    "personal_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relatorio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "PreferenciasAluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relatorio" ADD CONSTRAINT "Relatorio_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "PreferenciasPersonal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
