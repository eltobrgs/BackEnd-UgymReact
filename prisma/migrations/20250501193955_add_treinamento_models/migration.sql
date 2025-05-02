-- CreateTable
CREATE TABLE "Treino" (
    "id" SERIAL NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "aluno_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercicio" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "restTime" TEXT NOT NULL,
    "repsPerSet" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "treino_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercicio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "PreferenciasAluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercicio" ADD CONSTRAINT "Exercicio_treino_id_fkey" FOREIGN KEY ("treino_id") REFERENCES "Treino"("id") ON DELETE CASCADE ON UPDATE CASCADE;
