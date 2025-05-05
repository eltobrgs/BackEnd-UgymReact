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

  const todosAlunos = [];

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
              activityLevel: ['Leve', 'Moderado', 'Intenso'][Math.floor(Math.random() * 3)],
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

      // Adicionar o aluno à lista com os dados necessários
      todosAlunos.push({
        id: savedAluno.id,
        name: savedAluno.name,
        preferenciasId: savedAluno.preferenciasAluno.id
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
  return todosAlunos;
}

async function criarTreinos(alunos) {
  console.log("\n=== TREINOS ===");

  const imagensExercicios = [
    'data:image/png;base64,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',
    'https://via.placeholder.com/150',
    'https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  const nomeExercicios = [
    'Forward Lunge', 'Push Up', 'Squat', 'Plank', 'Deadlift', 
    'Burpee', 'Bench Press', 'Mountain Climber', 'Bicep Curl', 
    'Tricep Dip', 'Yoga', 'Pull Up', 'Crunches', 'Leg Press', 'Jumping Jacks'
  ];

  const temposSeries = ['30 Sec', '45 Sec', '1 Min', '2 Min'];
  const temposDescanso = ['30 Sec', '1 Min', '2 Min'];
  const statusOpcoes = ['completed', 'inprogress', 'not-started'];

  for (const aluno of alunos) {
    console.log(`\nCriando treinos para o aluno: ${aluno.name}`);
    
    if (!aluno.preferenciasId) {
      console.log(`- Preferências do aluno ${aluno.name} não encontradas, pulando`);
      continue;
    }

    // Criar treinos para cada dia da semana (0-6)
    for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
      // Domingo (0) e Sábado (6) com menos exercícios ou dia de descanso
      const qtdExercicios = diaSemana === 0 ? 1 : diaSemana === 6 ? 1 : Math.floor(Math.random() * 3) + 1;

      if (qtdExercicios > 0) {
        const exercicios = [];

        for (let i = 0; i < qtdExercicios; i++) {
          const nomeExercicio = nomeExercicios[Math.floor(Math.random() * nomeExercicios.length)];
          const imagemExercicio = imagensExercicios[Math.floor(Math.random() * imagensExercicios.length)];
          const tempoSerie = temposSeries[Math.floor(Math.random() * temposSeries.length)];
          const tempoDescanso = temposDescanso[Math.floor(Math.random() * temposDescanso.length)];
          const status = statusOpcoes[Math.floor(Math.random() * statusOpcoes.length)];
          const sets = Math.floor(Math.random() * 4) + 1;
          const repsPerSet = Math.floor(Math.random() * 15) + 5;

          exercicios.push({
            name: nomeExercicio,
            sets: sets,
            time: tempoSerie,
            restTime: tempoDescanso,
            repsPerSet: repsPerSet,
            status: status,
            image: imagemExercicio
          });
        }

        const treino = await prisma.treino.create({
          data: {
            diaSemana: diaSemana,
            alunoId: aluno.preferenciasId,
            exercicios: {
              create: exercicios
            }
          },
          include: {
            exercicios: true
          }
        });

        console.log(`- Treino para ${diaSemana === 0 ? 'Domingo' : 
                                   diaSemana === 1 ? 'Segunda-feira' : 
                                   diaSemana === 2 ? 'Terça-feira' : 
                                   diaSemana === 3 ? 'Quarta-feira' : 
                                   diaSemana === 4 ? 'Quinta-feira' : 
                                   diaSemana === 5 ? 'Sexta-feira' : 'Sábado'} 
                     criado com ${treino.exercicios.length} exercícios`);
      } else {
        console.log(`- Dia de descanso para ${diaSemana === 0 ? 'Domingo' : 
                                          diaSemana === 1 ? 'Segunda-feira' : 
                                          diaSemana === 2 ? 'Terça-feira' : 
                                          diaSemana === 3 ? 'Quarta-feira' : 
                                          diaSemana === 4 ? 'Quinta-feira' : 
                                          diaSemana === 5 ? 'Sexta-feira' : 'Sábado'}`);
      }
    }
  }

  console.log('Treinos criados com sucesso!');
}

// Função para criar pagamentos para alunos
async function criarPagamentos(alunos, academias) {
  console.log("\n=== PAGAMENTOS ===");
  
  const formasPagamento = [
    'Cartão de Crédito', 
    'Cartão de Débito', 
    'Boleto Bancário', 
    'PIX', 
    'Dinheiro',
    'Transferência Bancária'
  ];
  
  const statusOpcoes = ['PAGO', 'PENDENTE', 'ATRASADO'];
  const planosOpcoes = ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];
  const valoresPorPlano = {
    'MENSAL': { min: 80, max: 150 },
    'TRIMESTRAL': { min: 210, max: 400 },
    'SEMESTRAL': { min: 400, max: 700 },
    'ANUAL': { min: 750, max: 1200 }
  };
  
  // Data atual
  const dataAtual = new Date();
  
  for (const aluno of alunos) {
    console.log(`\nCriando histórico de pagamentos para o aluno: ${aluno.name}`);
    
    if (!aluno.preferenciasId) {
      console.log(`- Preferências do aluno ${aluno.name} não encontradas, pulando`);
      continue;
    }
    
    // Buscar a academia associada ao aluno
    const alunoPreferencias = await prisma.preferenciasAluno.findUnique({
      where: { id: aluno.preferenciasId }
    });
    
    if (!alunoPreferencias || !alunoPreferencias.academiaId) {
      console.log(`- Aluno ${aluno.name} não está associado a nenhuma academia, pulando`);
      continue;
    }
    
    // Usar a academia do aluno em vez de uma aleatória
    const academiaId = alunoPreferencias.academiaId;
    
    // Encontrar dados da academia para log
    const academiaInfo = academias.find(a => a.id === academiaId);
    const academiaNome = academiaInfo ? academiaInfo.name : `ID: ${academiaId}`;
    
    console.log(`- Academia: ${academiaNome}`);
    
    // Escolher um plano para o aluno
    const planoAtual = planosOpcoes[Math.floor(Math.random() * planosOpcoes.length)];
    
    // Definir valor da mensalidade baseado no plano
    const valorBase = Math.floor(
      Math.random() * (valoresPorPlano[planoAtual].max - valoresPorPlano[planoAtual].min) + 
      valoresPorPlano[planoAtual].min
    );
    
    // Gerar histórico de pagamentos (últimos 6 meses)
    for (let i = 0; i < 6; i++) {
      const dataVencimento = new Date(dataAtual);
      dataVencimento.setMonth(dataVencimento.getMonth() - i);
      dataVencimento.setDate(15); // Dia 15 de cada mês como vencimento
      
      // Para meses passados, status provavelmente PAGO
      // Para mês atual, pode ser PENDENTE ou PAGO
      // Para o mês futuro (caso i=0 e estamos no início do mês), pode ser PENDENTE
      let status;
      if (i > 0) {
        // Meses passados - 90% de chance de estar pago, 10% de estar atrasado
        status = Math.random() < 0.9 ? 'PAGO' : 'ATRASADO';
      } else {
        // Mês atual - 60% pago, 30% pendente, 10% atrasado
        const chance = Math.random();
        if (chance < 0.6) status = 'PAGO';
        else if (chance < 0.9) status = 'PENDENTE';
        else status = 'ATRASADO';
      }
      
      // Data de pagamento (caso esteja pago)
      let dataPagamento = null;
      if (status === 'PAGO') {
        dataPagamento = new Date(dataVencimento);
        // 70% de chance de pagar antes do vencimento
        if (Math.random() < 0.7) {
          dataPagamento.setDate(dataPagamento.getDate() - Math.floor(Math.random() * 10) - 1);
        } else {
          dataPagamento.setDate(dataPagamento.getDate() + Math.floor(Math.random() * 3) + 1);
        }
      } else {
        // Para pendente ou atrasado, a data de pagamento é a data atual (registro do pagamento)
        dataPagamento = new Date();
      }
      
      // Forma de pagamento aleatória
      const formaPagamento = formasPagamento[Math.floor(Math.random() * formasPagamento.length)];
      
      // Variação no valor (promoções, descontos, etc)
      const valorFinal = valorBase * (Math.random() * 0.1 + 0.95); // Entre 95% e 105% do valor base
      
      // Criar o pagamento
      const pagamento = await prisma.pagamento.create({
        data: {
          valor: parseFloat(valorFinal.toFixed(2)),
          dataPagamento,
          dataVencimento,
          status,
          formaPagamento,
          tipoPlano: planoAtual,
          observacoes: status === 'PAGO' 
            ? 'Pagamento realizado com sucesso' 
            : status === 'PENDENTE' 
              ? 'Aguardando confirmação de pagamento' 
              : 'Pagamento em atraso',
          alunoId: aluno.preferenciasId,
          academiaId: academiaId
        }
      });
      
      console.log(`- Pagamento ${i+1}: ${formatarData(dataVencimento)} - ${status} - ${planoAtual} - R$ ${valorFinal.toFixed(2)}`);
    }
  }
  
  console.log('Pagamentos criados com sucesso!');
}

// Função auxiliar para formatar data
function formatarData(data) {
  return data.toLocaleDateString('pt-BR');
}

// Função para criar relatórios de exemplo para alunos
async function criarRelatorios(alunos) {
  // Função para gerar uma data aleatória dentro de um intervalo
  const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };
  
  // Buscar todos os personais
  const personais = await prisma.preferenciasPersonal.findMany();
  
  console.log("\n=== RELATÓRIOS ===");
  // Para cada aluno, criar relatórios de diferentes tipos
  for (const aluno of alunos) {
    if (!aluno.preferenciasId) continue;
    
    console.log(`\nCriando relatórios para o aluno: ${aluno.name}`);
    
    const tiposRelatorio = ['peso', 'altura', 'medidas_braco', 'medidas_perna', 'medidas_cintura', 'gordura_corporal'];
    const personal = personais[Math.floor(Math.random() * personais.length)];
    
    // Gerar datas para os últimos 3 meses
    const hoje = new Date();
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(hoje.getMonth() - 3);
    
    // Para cada tipo de relatório, criar 5 registros com datas diferentes
    for (const tipo of tiposRelatorio) {
      console.log(`- Criando relatórios de ${tipo}`);
      
      for (let i = 0; i < 5; i++) {
        let valor;
        let observacao = '';
        
        // Gerar valores realistas para cada tipo
        switch (tipo) {
          case 'peso':
            valor = 60 + Math.random() * 40; // 60kg a 100kg
            observacao = i === 0 ? 'Medição inicial' : `Semana ${i}`;
            break;
          case 'altura':
            valor = 165 + Math.random() * 30; // 165cm a 195cm
            observacao = i === 0 ? 'Medição inicial' : `Atualização ${i}`;
            break;
          case 'medidas_braco':
            valor = 25 + Math.random() * 15; // 25cm a 40cm
            break;
          case 'medidas_perna':
            valor = 40 + Math.random() * 20; // 40cm a 60cm
            break;
          case 'medidas_cintura':
            valor = 60 + Math.random() * 40; // 60cm a 100cm
            break;
          case 'gordura_corporal':
            valor = 10 + Math.random() * 25; // 10% a 35%
            observacao = valor < 15 ? 'Atlético' : 
                        valor < 25 ? 'Fitness' : 'Precisa melhorar';
            break;
        }
        
        // Gerar data aleatória dentro do período
        const data = randomDate(tresMesesAtras, hoje);
        
        // Criar o relatório
        await prisma.report.create({
          data: {
            tipo,
            valor,
            data,
            observacao,
            alunoId: aluno.preferenciasId,
            personalId: personal.id
          }
        });
      }
    }
    
    console.log(`Total de ${tiposRelatorio.length * 5} relatórios criados para o aluno ${aluno.name}`);
  }
  
  console.log('Relatórios criados com sucesso!');
}

async function main() {
  try {
    console.log('Iniciando seed do banco de dados...');
    
    const academias = await criarAcademias();
    
    const academiaComPersonais = await criarPersonais(academias);
    
    const alunos = await criarAlunos(academiaComPersonais);
    
    await criarTreinos(alunos);
    
    await criarEventos(academias);
    
    await criarPagamentos(alunos, academias);
    
    // Criar relatórios de exemplo para alunos
    await criarRelatorios(alunos);
    
    console.log("\n=== RESUMO ===");
    console.log(`Academias criadas: ${academias.length}`);
    
    let totalPersonais = 0;
    for (const academia of academiaComPersonais) {
      totalPersonais += academia.personais.length;
    }
    console.log(`Personais criados: ${totalPersonais}`);
    console.log(`Alunos criados: ${alunos.length}`);
  } catch (e) {
    console.error('Erro durante a população:', e);
  } finally {
    await prisma.$disconnect();
  }
}

// Função para criar eventos simulados para as academias
async function criarEventos(academias) {
  console.log("\n=== EVENTOS ===");
  
  const tiposEventos = ["ALUNO", "PERSONAL", "TODOS"];
  const titulosEventos = [
    "Workshop de Nutrição", 
    "Maratona Fitness", 
    "Competição de Musculação", 
    "Palestra sobre Saúde Mental", 
    "Aula Especial de Yoga", 
    "Avaliação Física Gratuita", 
    "Campanha de Reciclagem", 
    "Desafio de Perda de Peso", 
    "Treinamento Funcional Especial",
    "Encontro de Personal Trainers"
  ];
  
  const locais = [
    "Sala de Eventos Principal", 
    "Área de Musculação", 
    "Quadra Poliesportiva", 
    "Sala de Yoga", 
    "Auditório", 
    "Piscina", 
    "Área Externa"
  ];
  
  for (const academia of academias) {
    console.log(`\nCriando eventos para a Academia ${academia.name}:`);
    
    // Criar entre 4 a 8 eventos por academia
    const quantidadeEventos = Math.floor(Math.random() * 5) + 4;
    
    for (let i = 0; i < quantidadeEventos; i++) {
      // Gerar datas aleatórias
      const dataAtual = new Date();
      
      // Gerar data de início aleatória dentro de -15 a +30 dias a partir de hoje
      const dataInicio = new Date(dataAtual);
      dataInicio.setDate(dataInicio.getDate() + (Math.floor(Math.random() * 45) - 15));
      
      // Gerar data de término entre 1 a 5 dias após o início
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + Math.floor(Math.random() * 5) + 1);
      
      // Escolher tipo aleatoriamente
      const tipo = tiposEventos[Math.floor(Math.random() * tiposEventos.length)];
      
      // Escolher título aleatoriamente
      const titulo = titulosEventos[Math.floor(Math.random() * titulosEventos.length)];
      
      // Gerar descrição
      const descricao = `Evento ${tipo === 'ALUNO' ? 'exclusivo para alunos' : 
                              tipo === 'PERSONAL' ? 'exclusivo para personais' : 
                              'aberto para todos os membros'} da academia. ${titulo} irá ocorrer entre ${dataInicio.toLocaleDateString('pt-BR')} e ${dataFim.toLocaleDateString('pt-BR')}.`;
      
      // Escolher local aleatoriamente
      const local = locais[Math.floor(Math.random() * locais.length)];
      
      // Criar evento
      const evento = await prisma.evento.create({
        data: {
          titulo,
          descricao,
          dataInicio,
          dataFim,
          local,
          tipo,
          academiaId: academia.id
        }
      });
      
      console.log(`- Evento: ${titulo} (${tipo})`);
      console.log(`  Data: ${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`);
      console.log(`  Local: ${local}`);
      console.log("------------------------------");
    }
  }
  
  console.log('Eventos criados com sucesso!');
}

// Executar script
main().catch(e => {
  console.error(e);
  process.exit(1);
});


