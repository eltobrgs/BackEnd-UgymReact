/*
  Warnings:

  - Added the required column `activityLevel` to the `Preferences` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `Preferences` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medicalConditions` to the `Preferences` table without a default value. This is not possible if the table is not empty.
  - Added the required column `physicalLimitations` to the `Preferences` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Preferences` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Preferences" ADD COLUMN     "activityLevel" TEXT NOT NULL,
ADD COLUMN     "height" TEXT NOT NULL,
ADD COLUMN     "medicalConditions" TEXT NOT NULL,
ADD COLUMN     "physicalLimitations" TEXT NOT NULL,
ADD COLUMN     "weight" TEXT NOT NULL;
