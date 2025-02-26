import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function limparBancoDeDados() {
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "Academia" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "PreferenciasPersonal" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "PreferenciasAluno" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    console.log('Tabelas limpas com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar tabelas:', error);
  }
}

async function criarAlunos() {
  const usuarios = [
    {
      name: 'João Silva',
      email: 'joao@teste.com',
      password: '123456',
      preferences: {
        birthDate: new Date('1990-05-15'),
        gender: 'Masculino',
        goal: 'Ganho de massa muscular',
        healthCondition: 'Saudável',
        experience: 'Intermediário',
        height: '175',
        weight: '75',
        activityLevel: 'Moderado',
        medicalConditions: 'Nenhuma',
        physicalLimitations: 'Nenhuma'
      }
    },
    {
      name: 'Maria Santos',
      email: 'maria@teste.com',
      password: '123456',
      preferences: {
        birthDate: new Date('1995-08-20'),
        gender: 'Feminino',
        goal: 'Perda de peso',
        healthCondition: 'Saudável',
        experience: 'Iniciante',
        height: '165',
        weight: '68',
        activityLevel: 'Leve',
        medicalConditions: 'Nenhuma',
        physicalLimitations: 'Nenhuma'
      }
    },
    {
      name: 'Pedro Oliveira',
      email: 'pedro@teste.com',
      password: '123456',
      preferences: {
        birthDate: new Date('1988-12-10'),
        gender: 'Masculino',
        goal: 'Definição muscular',
        healthCondition: 'Saudável',
        experience: 'Avançado',
        height: '180',
        weight: '82',
        activityLevel: 'Intenso',
        medicalConditions: 'Nenhuma',
        physicalLimitations: 'Nenhuma'
      }
    },
    {
      name: 'Ana Souza',
      email: 'ana@teste.com',
      password: '123456',
      preferences: {
        birthDate: new Date('1992-03-25'),
        gender: 'Feminino',
        goal: 'Condicionamento físico',
        healthCondition: 'Saudável',
        experience: 'Intermediário',
        height: '170',
        weight: '65',
        activityLevel: 'Moderado',
        medicalConditions: 'Nenhuma',
        physicalLimitations: 'Nenhuma'
      }
    },
    {
      name: 'Lucas Ferreira',
      email: 'lucas@teste.com',
      password: '123456',
      preferences: {
        birthDate: new Date('1985-07-08'),
        gender: 'Masculino',
        goal: 'Reabilitação',
        healthCondition: 'Em recuperação',
        experience: 'Iniciante',
        height: '178',
        weight: '80',
        activityLevel: 'Leve',
        medicalConditions: 'Lesão no joelho',
        physicalLimitations: 'Limitação de movimentos no joelho direito'
      }
    }
  ];

  for (const usuario of usuarios) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(usuario.password, salt);

    await prisma.user.create({
        data: {
          name: usuario.name,
          email: usuario.email,
          password: hash,
        role: 'ALUNO',
        preferenciasAluno: {
            create: usuario.preferences
          }
        }
      });
  }

  console.log('Alunos criados com sucesso!');
}

async function criarPersonais() {
  const personais = [
    {
      name: 'Carlos Mendes',
      email: 'carlos@personal.com',
      password: '123456',
      personal: {
        cref: '123456-G/SP',
        specialization: 'Musculação',
        birthDate: new Date('1985-04-12'),
        gender: 'Masculino',
        specializations: ['Musculação', 'Treinamento Funcional', 'Hipertrofia'],
        yearsOfExperience: '10',
        workSchedule: 'Segunda a Sexta, 6h às 22h',
        certifications: ['CREF', 'Especialização em Treinamento de Força'],
        biography: 'Personal trainer com mais de 10 anos de experiência em musculação e hipertrofia.',
        workLocation: 'São Paulo, SP',
        pricePerHour: '120',
        languages: ['Português', 'Inglês'],
        instagram: 'carlosmendes',
        linkedin: 'https://linkedin.com/in/carlosmendes'
      }
    },
    {
      name: 'Juliana Costa',
      email: 'juliana@personal.com',
      password: '123456',
      personal: {
        cref: '789012-G/SP',
        specialization: 'Pilates',
        birthDate: new Date('1990-08-25'),
        gender: 'Feminino',
        specializations: ['Pilates', 'Yoga', 'Alongamento'],
        yearsOfExperience: '8',
        workSchedule: 'Segunda a Sábado, 7h às 20h',
        certifications: ['CREF', 'Certificação em Pilates', 'Yoga Alliance'],
        biography: 'Especialista em Pilates e Yoga, com foco em bem-estar e qualidade de vida.',
        workLocation: 'São Paulo, SP',
        pricePerHour: '150',
        languages: ['Português', 'Espanhol'],
        instagram: 'julianacosta',
        linkedin: 'https://linkedin.com/in/julianacosta'
      }
    },
    {
      name: 'Rafael Almeida',
      email: 'rafael@personal.com',
      password: '123456',
      personal: {
        cref: '345678-G/SP',
        specialization: 'Treinamento Funcional',
        birthDate: new Date('1988-11-15'),
        gender: 'Masculino',
        specializations: ['Treinamento Funcional', 'CrossFit', 'HIIT'],
        yearsOfExperience: '12',
        workSchedule: 'Segunda a Sexta, 6h às 21h',
        certifications: ['CREF', 'CrossFit Level 2', 'Especialização em HIIT'],
        biography: 'Especialista em treinamento funcional e CrossFit, com foco em alta performance.',
        workLocation: 'São Paulo, SP',
        pricePerHour: '130',
        languages: ['Português', 'Inglês'],
        instagram: 'rafaelalmeida',
        linkedin: 'https://linkedin.com/in/rafaelalmeida'
      }
    }
  ];

  for (const personal of personais) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(personal.password, salt);

    await prisma.user.create({
        data: {
          name: personal.name,
          email: personal.email,
          password: hash,
        role: 'PERSONAL',
        preferenciasPersonal: {
          create: personal.personal
        }
      }
    });
  }

  console.log('Personais criados com sucesso!');
}

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
        descricao: 'Academia specializada em musculação e treinamento de força.',
        comodidades: ['Estacionamento', 'Vestiário', 'Armários', 'Área de alongamento', 'Suplementos'],
        planos: ['Mensal: R$ 89,90', 'Semestral: R$ 479,90', 'Anual: R$ 859,90'],
        website: 'www.powergym.com.br',
        instagram: 'powergym',
        facebook: 'powerGymAcademia'
      }
    },
    {
      name: 'Vida Ativa',
      email: 'contato@vidaativa.com',
      password: '123456',
      academia: {
        cnpj: '45.678.901/0001-23',
        endereco: 'Av. Brigadeiro Faria Lima, 1500, São Paulo, SP',
        telefone: '(11) 4567-8901',
        horarioFuncionamento: 'Segunda a Sexta: 5h às 22h, Sábado e Domingo: 8h às 18h',
        descricao: 'Academia com foco em bem-estar e qualidade de vida, oferecendo diversas modalidades.',
        comodidades: ['Estacionamento', 'Vestiário', 'Piscina', 'Sauna', 'Sala de yoga', 'Nutricionista'],
        planos: ['Mensal: R$ 129,90', 'Trimestral: R$ 349,90', 'Anual: R$ 1199,90'],
        website: 'www.vidaativa.com.br',
        instagram: 'vidaativafitness',
        facebook: 'vidaAtivaFitness'
      }
    }
  ];

  for (const academia of academias) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(academia.password, salt);

    await prisma.user.create({
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
        }
      });
  }

  console.log('Academias de teste criadas com sucesso!');
}

async function main() {
  try {
  await limparBancoDeDados();
    await criarAlunos();
  await criarPersonais();
    await criarAcademias();
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