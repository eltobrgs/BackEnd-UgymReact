-- AlterTable
ALTER TABLE "Preferences" ADD COLUMN     "personalId" INTEGER;

-- AddForeignKey
ALTER TABLE "Preferences" ADD CONSTRAINT "Preferences_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "Personal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
