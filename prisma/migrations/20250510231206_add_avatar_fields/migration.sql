-- AlterTable
ALTER TABLE "Academia" ADD COLUMN     "academia_avatar" TEXT;

-- AlterTable
ALTER TABLE "Exercicio" ADD COLUMN     "gif_url" TEXT,
ADD COLUMN     "video_url" TEXT;

-- AlterTable
ALTER TABLE "PreferenciasAluno" ADD COLUMN     "user_avatar" TEXT;

-- AlterTable
ALTER TABLE "PreferenciasPersonal" ADD COLUMN     "user_avatar" TEXT;
