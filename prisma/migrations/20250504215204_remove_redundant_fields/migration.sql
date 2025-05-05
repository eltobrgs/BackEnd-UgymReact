/*
  Warnings:

  - You are about to drop the column `height` on the `PreferenciasAluno` table. All the data in the column will be lost.
  - You are about to drop the column `medicalConditions` on the `PreferenciasAluno` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `PreferenciasAluno` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PreferenciasAluno" DROP COLUMN "height",
DROP COLUMN "medicalConditions",
DROP COLUMN "weight";
