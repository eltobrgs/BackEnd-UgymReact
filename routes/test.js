import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function limparBancoDeDados() {
  try {
    await prisma.$executeRaw`TRUNCATE TABLE "Personal" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Preferences" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    console.log('Tabelas limpas com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar tabelas:', error);
  }
}

async function criarUsuariosComuns() {
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
        birthDate: new Date('1988-03-10'),
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
      name: 'Ana Costa',
      email: 'ana@teste.com',
      password: '123456',
      preferences: {
        birthDate: new Date('1992-11-25'),
        gender: 'Feminino',
        goal: 'Condicionamento físico',
        healthCondition: 'Saudável',
        experience: 'Intermediário',
        height: '170',
        weight: '63',
        activityLevel: 'Moderado',
        medicalConditions: 'Nenhuma',
        physicalLimitations: 'Nenhuma'
      }
    },
    {
      name: 'Lucas Mendes',
      email: 'lucas@teste.com',
      password: '123456',
      preferences: {
        birthDate: new Date('1993-07-05'),
        gender: 'Masculino',
        goal: 'Hipertrofia',
        healthCondition: 'Saudável',
        experience: 'Iniciante',
        height: '178',
        weight: '70',
        activityLevel: 'Moderado',
        medicalConditions: 'Nenhuma',
        physicalLimitations: 'Nenhuma'
      }
    }
  ];

  for (const usuario of usuarios) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(usuario.password, salt);

    try {
      const savedUser = await prisma.user.create({
        data: {
          name: usuario.name,
          email: usuario.email,
          password: hash,
          role: 'USUARIO_COMUM',
          preferences: {
            create: usuario.preferences
          }
        }
      });
      console.log(`Usuário comum criado: ${savedUser.name}`);
    } catch (error) {
      console.error(`Erro ao criar usuário ${usuario.name}:`, error);
    }
  }
}

async function criarPersonais() {
  const personais = [
    {
      name: 'Rafael Trainer',
      email: 'rafael@personal.com',
      password: '123456',
      cref: '123456-G/SP',
      personal: {
        specialization: 'Musculação',
        birthDate: new Date('1985-02-15'),
        gender: 'Masculino',
        specializations: ['Musculação', 'CrossFit'],
        yearsOfExperience: '10',
        workSchedule: '6h às 22h',
        certifications: ['CREF', 'CrossFit L1'],
        biography: 'Especialista em hipertrofia e força',
        workLocation: 'São Paulo, SP',
        pricePerHour: '150',
        languages: ['Português', 'Inglês']
      }
    },
    {
      name: 'Carla Fitness',
      email: 'carla@personal.com',
      password: '123456',
      cref: '789012-G/SP',
      personal: {
        specialization: 'Funcional',
        birthDate: new Date('1990-06-20'),
        gender: 'Feminino',
        specializations: ['Funcional', 'Pilates'],
        yearsOfExperience: '8',
        workSchedule: '7h às 21h',
        certifications: ['CREF', 'Pilates'],
        biography: 'Especialista em treinamento funcional',
        workLocation: 'São Paulo, SP',
        pricePerHour: '130',
        languages: ['Português']
      }
    },
    {
      name: 'Bruno Coach',
      email: 'bruno@personal.com',
      password: '123456',
      cref: '345678-G/SP',
      personal: {
        specialization: 'Crossfit',
        birthDate: new Date('1988-09-10'),
        gender: 'Masculino',
        specializations: ['CrossFit', 'Weightlifting'],
        yearsOfExperience: '12',
        workSchedule: '5h às 21h',
        certifications: ['CREF', 'CrossFit L2', 'Weightlifting'],
        biography: 'Especialista em CrossFit e levantamento de peso',
        workLocation: 'São Paulo, SP',
        pricePerHour: '180',
        languages: ['Português', 'Inglês', 'Espanhol']
      }
    },
    {
      name: 'Amanda Wellness',
      email: 'amanda@personal.com',
      password: '123456',
      cref: '901234-G/SP',
      personal: {
        specialization: 'Yoga',
        birthDate: new Date('1992-12-03'),
        gender: 'Feminino',
        specializations: ['Yoga', 'Pilates', 'Meditação'],
        yearsOfExperience: '6',
        workSchedule: '8h às 20h',
        certifications: ['CREF', 'Yoga Alliance'],
        biography: 'Especialista em bem-estar e yoga',
        workLocation: 'São Paulo, SP',
        pricePerHour: '140',
        languages: ['Português', 'Inglês']
      }
    },
    {
      name: 'Marcos Strong',
      email: 'marcos@personal.com',
      password: '123456',
      cref: '567890-G/SP',
      personal: {
        specialization: 'Powerlifting',
        birthDate: new Date('1987-04-25'),
        gender: 'Masculino',
        specializations: ['Powerlifting', 'Musculação'],
        yearsOfExperience: '15',
        workSchedule: '6h às 22h',
        certifications: ['CREF', 'Powerlifting Coach'],
        biography: 'Especialista em força e powerlifting',
        workLocation: 'São Paulo, SP',
        pricePerHour: '160',
        languages: ['Português']
      }
    }
  ];

  for (const personal of personais) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(personal.password, salt);

    try {
      const savedUser = await prisma.user.create({
        data: {
          name: personal.name,
          email: personal.email,
          password: hash,
          role: 'PERSONAL',
          personal: {
            create: {
              ...personal.personal,
              cref: personal.cref
            }
          }
        }
      });
      console.log(`Personal trainer criado: ${savedUser.name}`);
    } catch (error) {
      console.error(`Erro ao criar personal ${personal.name}:`, error);
    }
  }
}

async function main() {
  console.log('Iniciando script de teste...');
  
  await limparBancoDeDados();
  console.log('Criando usuários comuns...');
  await criarUsuariosComuns();
  console.log('Criando personais...');
  await criarPersonais();
  
  console.log('Script de teste concluído!');
  await prisma.$disconnect();
}

main()
  .catch((error) => {
    console.error('Erro durante a execução do script:', error);
    process.exit(1);
  });


// Executar o script com o comando: node test.js dentro da pasta routes