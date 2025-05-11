/*
  Warnings:

  - You are about to drop the column `user_avatar` on the `PreferenciasAluno` table. All the data in the column will be lost.
  - You are about to drop the column `user_avatar` on the `PreferenciasPersonal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PreferenciasAluno" DROP COLUMN "user_avatar",
ADD COLUMN     "aluno_avatar" TEXT;

-- AlterTable
ALTER TABLE "PreferenciasPersonal" DROP COLUMN "user_avatar",
ADD COLUMN     "personal_avatar" TEXT;
