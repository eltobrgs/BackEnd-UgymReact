/*
  Warnings:

  - The `tipoEvento` column on the `Evento` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Evento" DROP CONSTRAINT "Evento_academia_id_fkey";

-- AlterTable
ALTER TABLE "Evento" DROP COLUMN "tipoEvento",
ADD COLUMN     "tipoEvento" TEXT NOT NULL DEFAULT 'TODOS';

-- DropEnum
DROP TYPE "TipoEvento";

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_academia_id_fkey" FOREIGN KEY ("academia_id") REFERENCES "Academia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
