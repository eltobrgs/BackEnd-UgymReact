import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();


async function criarAcademias() {
  const academias = [
    {
      name: 'Academia Fitness Total',
      email: 'fitness@academia.com',
      password: '123456',
      academia: {
        cnpj: '12.345.678/0001-90',
        endereco: 'Av. Paulista, 1000, São Paulo, SP',
        telefone: '(11) 3456-7890',
        horarioFuncionamento: 'Segunda a Sexta: 6h às 22h, Sábado: 8h às 18h, Domingo: 8h às 14h',
        descricao: 'Academia completa com equipamentos modernos e profissionais qualificados.',
        comodidades: ['Estacionamento', 'Vestiário', 'Chuveiros', 'Armários', 'Lanchonete', 'Wi-Fi'],
        planos: ['Mensal: R$ 99,90', 'Trimestral: R$ 269,90', 'Anual: R$ 899,90'],
        website: 'www.fitnesstotal.com.br',
        instagram: 'fitnesstotal',
        facebook: 'academiaFitnessTotal'
      }
    },
    {
      name: 'Power Gym',
      email: 'contato@powergym.com',
      password: '123456',
      academia: {
        cnpj: '98.765.432/0001-10',
        endereco: 'Rua Augusta, 500, São Paulo, SP',
        telefone: '(11) 2345-6789',
        horarioFuncionamento: 'Segunda a Sábado: 6h às 23h, Domingo: 8h às 16h',
        descricao: 'Academia especializada em musculação e treinamento de força.',
        comodidades: ['Estacionamento', 'Vestiário', 'Armários', 'Área de alongamento', 'Suplementos'],
        planos: ['Mensal: R$ 89,90', 'Semestral: R$ 479,90', 'Anual: R$ 859,90'],
        website: 'www.powergym.com.br',
        instagram: 'powergym',
        facebook: 'powerGymAcademia'
      }
    }
  ];

  console.log("=== ACADEMIAS ===");
  const academiaIds = [];

  for (const academia of academias) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(academia.password, salt);

    const savedAcademia = await prisma.user.create({
      data: {
        name: academia.name,
        email: academia.email,
        password: hash,
        role: 'ACADEMIA',
        academia: {
            create: {
            cnpj: academia.academia.cnpj,
            endereco: academia.academia.endereco,
            telefone: academia.academia.telefone,
            horarioFuncionamento: academia.academia.horarioFuncionamento,
            descricao: academia.academia.descricao,
            comodidades: academia.academia.comodidades,
            planos: academia.academia.planos,
            website: academia.academia.website,
            instagram: academia.academia.instagram,
            facebook: academia.academia.facebook
            }
          }
      },
      include: {
        academia: true
      }
    });

    academiaIds.push({
      id: savedAcademia.academia.id,
      name: savedAcademia.name
    });
    
    console.log(`Academia: ${academia.name}`);
    console.log(`- Email: ${academia.email}`);
    console.log(`- Senha: ${academia.password}`);
    console.log(`- ID: ${savedAcademia.academia.id}`);
    console.log("------------------------------");
  }

  console.log('Academias criadas com sucesso!');
  return academiaIds;
}

async function criarPersonais(academias) {
  console.log("\n=== PERSONAIS (@personal) ===");
  const personaisPorAcademia = [];

  const nomesPersonais = [
    { nome: 'Carlos Mendes', email: 'carlos', cref: '123456-G/SP', especializacao: 'Musculação' },
    { nome: 'Juliana Costa', email: 'juliana', cref: '234567-G/SP', especializacao: 'Pilates' },
    { nome: 'Rafael Almeida', email: 'rafael', cref: '345678-G/SP', especializacao: 'Treinamento Funcional' },
    { nome: 'Bianca Oliveira', email: 'bianca', cref: '456789-G/SP', especializacao: 'Crossfit' },
    { nome: 'Thiago Santos', email: 'thiago', cref: '567890-G/SP', especializacao: 'Yoga' },
    { nome: 'Amanda Ribeiro', email: 'amanda', cref: '678901-G/SP', especializacao: 'Natação' },
    { nome: 'Leonardo Ferreira', email: 'leonardo', cref: '789012-G/SP', especializacao: 'Hipertrofia' },
    { nome: 'Patricia Dias', email: 'patricia', cref: '890123-G/SP', especializacao: 'Ginástica' },
    { nome: 'Gustavo Lima', email: 'gustavo', cref: '901234-G/SP', especializacao: 'Aeróbica' },
    { nome: 'Mariana Silva', email: 'mariana', cref: '012345-G/SP', especializacao: 'Condicionamento Físico' }
  ];

  for (const academia of academias) {
    console.log(`\nPersonais da Academia ${academia.name}:`);
    const personaisDaAcademia = [];
    
    for (let i = 0; i < 5; i++) {
      const index = academias.indexOf(academia) * 5 + i;
      if (index >= nomesPersonais.length) break;
      
      const personalInfo = nomesPersonais[index];
      
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('123456', salt);

      const email = `${personalInfo.email}@${academia.name.toLowerCase().replace(/\s+/g, '')}.com`;

      const savedPersonal = await prisma.user.create({
        data: {
          name: personalInfo.nome,
          email: email,
          password: hash,
          role: 'PERSONAL',
          preferenciasPersonal: {
            create: {
              cref: personalInfo.cref,
              specialization: personalInfo.especializacao,
              birthDate: new Date(1985, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
              gender: Math.random() > 0.5 ? 'Masculino' : 'Feminino',
              specializations: [personalInfo.especializacao, 'Alongamento', 'Aeróbico'],
              yearsOfExperience: `${Math.floor(Math.random() * 15) + 3}`,
              workSchedule: 'Segunda a Sexta, 6h às 22h',
              certifications: ['CREF', `Especialização em ${personalInfo.especializacao}`],
              biography: `Profissional com ampla experiência em ${personalInfo.especializacao}. Atendimento personalizado de acordo com o objetivo do aluno.`,
              workLocation: academia.name,
              pricePerHour: `${Math.floor(Math.random() * 100) + 50}`,
              languages: ['Português', Math.random() > 0.5 ? 'Inglês' : 'Espanhol'],
              instagram: personalInfo.email.toLowerCase(),
              linkedin: `https://linkedin.com/in/${personalInfo.email.toLowerCase()}`,
              academiaId: academia.id
            }
          }
        },
        include: {
          preferenciasPersonal: true
        }
      });

      personaisDaAcademia.push({
        id: savedPersonal.id,
        preferenciasId: savedPersonal.preferenciasPersonal.id,
        name: savedPersonal.name
      });
      
      console.log(`@personal ${personalInfo.nome}`);
      console.log(`- Email: ${email}`);
      console.log(`- Senha: 123456`);
      console.log(`- CREF: ${personalInfo.cref}`);
      console.log(`- Especialização: ${personalInfo.especializacao}`);
      console.log("------------------------------");
    }
    
    personaisPorAcademia.push({
      academiaId: academia.id,
      academiaNome: academia.name,
      personais: personaisDaAcademia
    });
  }

  console.log('Personais criados com sucesso!');
  return personaisPorAcademia;
}

async function criarAlunos(academiaComPersonais) {
  console.log("\n=== ALUNOS (@aluno) ===");
  const nomesAlunos = [
    { nome: 'João Silva', email: 'joao' },
    { nome: 'Maria Santos', email: 'maria' },
    { nome: 'Pedro Oliveira', email: 'pedro' },
    { nome: 'Ana Souza', email: 'ana' },
    { nome: 'Lucas Ferreira', email: 'lucas' },
    { nome: 'Fernanda Lima', email: 'fernanda' },
    { nome: 'Gabriel Costa', email: 'gabriel' },
    { nome: 'Camila Martins', email: 'camila' },
    { nome: 'Bruno Alves', email: 'bruno' },
    { nome: 'Juliana Rodrigues', email: 'juliana' },
    { nome: 'Ricardo Gomes', email: 'ricardo' },
    { nome: 'Daniela Pereira', email: 'daniela' }
  ];

  const objetivos = [
    'Ganho de massa muscular',
    'Perda de peso',
    'Definição muscular',
    'Condicionamento físico',
    'Reabilitação',
    'Melhora da postura'
  ];

  for (const academiaDados of academiaComPersonais) {
    console.log(`\nAlunos da Academia ${academiaDados.academiaNome}:`);
    
    for (let i = 0; i < 3; i++) {
      const index = academiaComPersonais.indexOf(academiaDados) * 3 + i;
      if (index >= nomesAlunos.length) break;
      
      const alunoInfo = nomesAlunos[index];
      const objetivo = objetivos[Math.floor(Math.random() * objetivos.length)];
      
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('123456', salt);

      const personalIndex = Math.floor(Math.random() * academiaDados.personais.length);
      const personal = academiaDados.personais[personalIndex];
      const associarAPersonal = Math.random() > 0.33;
      
      const email = `${alunoInfo.email}@${academiaDados.academiaNome.toLowerCase().replace(/\s+/g, '')}.com`;

      const savedAluno = await prisma.user.create({
        data: {
          name: alunoInfo.nome,
          email: email,
          password: hash,
          role: 'ALUNO',
          preferenciasAluno: {
            create: {
              birthDate: new Date(1990 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
              gender: Math.random() > 0.5 ? 'Masculino' : 'Feminino',
              goal: objetivo,
              healthCondition: 'Saudável',
              experience: ['Iniciante', 'Intermediário', 'Avançado'][Math.floor(Math.random() * 3)],
              height: `${165 + Math.floor(Math.random() * 30)}`,
              weight: `${50 + Math.floor(Math.random() * 50)}`,
              activityLevel: ['Leve', 'Moderado', 'Intenso'][Math.floor(Math.random() * 3)],
              medicalConditions: 'Nenhuma',
              physicalLimitations: 'Nenhuma',
              personalId: associarAPersonal ? personal.preferenciasId : null,
              academiaId: academiaDados.academiaId
            }
          }
        },
        include: {
          preferenciasAluno: true
        }
      });
      
      console.log(`@aluno ${alunoInfo.nome}`);
      console.log(`- Email: ${email}`);
      console.log(`- Senha: 123456`);
      console.log(`- Objetivo: ${objetivo}`);
      if (associarAPersonal) {
        console.log(`- Personal vinculado: ${personal.name}`);
      } else {
        console.log(`- Sem personal vinculado`);
      }
      console.log("------------------------------");
    }
  }

  console.log('Alunos criados com sucesso!');
}

async function main() {
  try {
    console.log('Iniciando seed do banco de dados...');
    
    const academias = await criarAcademias();
    
    const academiasComPersonais = await criarPersonais(academias);
    
    await criarAlunos(academiasComPersonais);
    
    console.log('Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('Erro ao popular banco de dados:', error);
  } finally {
  await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


// Executar o script com o comando: node test.js dentro da pasta routes