-- CreateTable
CREATE TABLE "EventoPresenca" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoPresenca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventoPresenca_evento_id_user_id_key" ON "EventoPresenca"("evento_id", "user_id");

-- AddForeignKey
ALTER TABLE "EventoPresenca" ADD CONSTRAINT "EventoPresenca_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
