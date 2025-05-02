-- CreateTable
CREATE TABLE "RelatorioAluno" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "aluno_id" INTEGER NOT NULL,
    "personal_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelatorioAluno_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RelatorioAluno" ADD CONSTRAINT "RelatorioAluno_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "PreferenciasAluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatorioAluno" ADD CONSTRAINT "RelatorioAluno_personal_id_fkey" FOREIGN KEY ("personal_id") REFERENCES "PreferenciasPersonal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
