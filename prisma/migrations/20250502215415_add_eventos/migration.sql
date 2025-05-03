/*
  Warnings:

  - You are about to drop the column `tipoEvento` on the `Evento` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `Evento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Evento" DROP CONSTRAINT "Evento_academia_id_fkey";

-- AlterTable
ALTER TABLE "Evento" DROP COLUMN "tipoEvento",
ADD COLUMN     "tipo" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_academia_id_fkey" FOREIGN KEY ("academia_id") REFERENCES "Academia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
