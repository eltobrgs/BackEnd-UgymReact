/*
  Warnings:

  - You are about to drop the column `nomeFantasia` on the `Academia` table. All the data in the column will be lost.
  - You are about to drop the column `razaoSocial` on the `Academia` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Academia" DROP COLUMN "nomeFantasia",
DROP COLUMN "razaoSocial";
