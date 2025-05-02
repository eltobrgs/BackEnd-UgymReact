import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar se o aluno com ID 14 existe
    const aluno = await prisma.preferenciasAluno.findUnique({
      where: { id: 14 },
      include: { user: true }
    });
    
    console.log('Aluno ID 14:', aluno);
    
    // Verificar todos os alunos disponíveis
    const todosAlunos = await prisma.preferenciasAluno.findMany({
      select: {
        id: true,
        userId: true,
        personalId: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('Total de alunos:', todosAlunos.length);
    console.log('Lista de alunos:');
    todosAlunos.forEach(a => console.log(`ID: ${a.id}, UserID: ${a.userId}, PersonalID: ${a.personalId}, Nome: ${a.user.name}`));
    
    // Verificar o personal do usuário ID 3
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: 3 },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        students: true
      }
    });
    
    console.log('\nPersonal do usuário ID 3:');
    if (personal) {
      console.log(`ID: ${personal.id}, UserID: ${personal.userId}, Nome: ${personal.user.name}`);
      console.log('Alunos vinculados:', personal.students.map(s => s.id));
    } else {
      console.log('Personal não encontrado');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 