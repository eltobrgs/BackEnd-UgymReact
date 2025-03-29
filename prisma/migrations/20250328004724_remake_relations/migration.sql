-- AlterTable
ALTER TABLE "PreferenciasAluno" ADD COLUMN     "academia_id" INTEGER;

-- AlterTable
ALTER TABLE "PreferenciasPersonal" ADD COLUMN     "academia_id" INTEGER;

-- AddForeignKey
ALTER TABLE "PreferenciasAluno" ADD CONSTRAINT "PreferenciasAluno_academia_id_fkey" FOREIGN KEY ("academia_id") REFERENCES "Academia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenciasPersonal" ADD CONSTRAINT "PreferenciasPersonal_academia_id_fkey" FOREIGN KEY ("academia_id") REFERENCES "Academia"("id") ON DELETE SET NULL ON UPDATE CASCADE;
