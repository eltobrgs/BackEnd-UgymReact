-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('TODOS', 'ALUNOS', 'PERSONAIS');

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "tipoEvento" "TipoEvento" NOT NULL DEFAULT 'TODOS',
    "academia_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_academia_id_fkey" FOREIGN KEY ("academia_id") REFERENCES "Academia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
