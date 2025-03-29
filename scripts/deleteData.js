import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limparBancoDeDados() {
  try {
    console.log('Iniciando limpeza do banco de dados...');

    // Primeiro, atualizar registros para remover chaves estrangeiras
    await prisma.preferenciasAluno.updateMany({
      data: { 
        personalId: null,
        academiaId: null
      }
    });

    await prisma.preferenciasPersonal.updateMany({
      data: { 
        academiaId: null
      }
    });

    // Excluir registros na ordem correta para respeitar relações
    await prisma.$executeRaw`TRUNCATE TABLE "PreferenciasAluno" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "PreferenciasPersonal" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Academia" RESTART IDENTITY CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;

    console.log('Tabelas limpas com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função de limpeza
limparBancoDeDados()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 