import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// Middleware para verificar se o usuário é aluno
const isAluno = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ALUNO') {
      return res.status(403).json({ error: "Acesso negado. Apenas alunos podem acessar esta funcionalidade" });
    }

    next();
  } catch (err) {
    console.error("Erro ao verificar perfil de usuário:", err);
    return res.status(500).json({ error: "Erro ao verificar perfil de usuário" });
  }
};

// Middleware para verificar se o usuário é aluno ou academia
const isAlunoOrAcademia = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'ALUNO' && user.role !== 'ACADEMIA')) {
      return res.status(403).json({ error: "Acesso negado. Apenas alunos ou academias podem acessar esta funcionalidade" });
    }

    next();
  } catch (err) {
    console.error("Erro ao verificar perfil de usuário:", err);
    return res.status(500).json({ error: "Erro ao verificar perfil de usuário" });
  }
};

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Buscar preferências do aluno
router.get("/aluno/preferencias", async (req, res) => {
  try {
    // Verificar se foi passado um ID de aluno (para caso de academia consultando)
    const { alunoId } = req.query;
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Determinar o ID do usuário para consultar as preferências
    let targetUserId = req.userId;

    // Se o usuário for academia e um ID de aluno foi fornecido, use esse ID
    if (user.role === 'ACADEMIA' && alunoId) {
      // Verificar se o aluno existe
      const aluno = await prisma.user.findFirst({
        where: { 
          id: parseInt(alunoId),
          role: 'ALUNO'
        }
      });
      
      if (!aluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }
      
      targetUserId = aluno.id;
    } else if (user.role !== 'ALUNO' && user.role !== 'ACADEMIA') {
      // Se não for aluno nem academia, negar acesso
      return res.status(403).json({ error: "Acesso negado. Apenas alunos ou academias podem acessar esta funcionalidade" });
    }

    // Buscar preferências
    const preferences = await prisma.preferenciasAluno.findUnique({
      where: { userId: targetUserId },
    });

    if (!preferences) {
      return res.status(404).json({ error: "Preferências não encontradas" });
    }

    // Formatar data para exibição
    const formattedBirthDate = new Date(preferences.birthDate).toLocaleDateString('pt-BR');

    res.status(200).json({
      ...preferences,
      birthDate: formattedBirthDate,
    });
  } catch (err) {
    console.error("Erro ao buscar preferências:", err);
    res.status(500).json({ error: "Erro ao buscar preferências" });
  }
});

// Salvar/atualizar preferências do aluno
router.post("/aluno/preferencias", async (req, res) => {
  try {
    const { 
      birthDate, 
      gender, 
      goal, 
      healthCondition, 
      experience, 
      height, 
      weight, 
      activityLevel, 
      medicalConditions, 
      physicalLimitations,
      academiaId,
      alunoId // ID do aluno quando academia está editando
    } = req.body;

    // Verificar e converter a data
    const [day, month, year] = birthDate.split('/');
    const parsedBirthDate = new Date(`${year}-${month}-${day}`);

    if (isNaN(parsedBirthDate)) {
      return res.status(400).json({ error: "Formato de data inválido para birthDate. Use DD/MM/YYYY" });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Determinar o ID do usuário para o qual salvar as preferências
    let targetUserId = req.userId;

    // Se o usuário for academia e um ID de aluno foi fornecido, use esse ID
    if (user.role === 'ACADEMIA' && alunoId) {
      // Verificar se o aluno existe
      const aluno = await prisma.user.findFirst({
        where: { 
          id: parseInt(alunoId),
          role: 'ALUNO'
        }
      });
      
      if (!aluno) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }
      
      targetUserId = aluno.id;
    } else if (user.role !== 'ALUNO' && user.role !== 'ACADEMIA') {
      // Se não for aluno nem academia, negar acesso
      return res.status(403).json({ error: "Acesso negado. Apenas alunos ou academias podem acessar esta funcionalidade" });
    }

    // Verificar se academiaId é válido quando fornecido
    let academiaIdParsed = null;
    if (academiaId) {
      academiaIdParsed = parseInt(academiaId);
      const academia = await prisma.academia.findUnique({
        where: { id: academiaIdParsed }
      });
      
      if (!academia) {
        return res.status(400).json({ error: "Academia não encontrada" });
      }
    }

    // Verificar se já existem preferências
    const existingPreferences = await prisma.preferenciasAluno.findUnique({
      where: { userId: targetUserId },
    });

    // Dados a serem salvos/atualizados
    const preferencesData = {
      birthDate: parsedBirthDate.toISOString(),
      gender,
      goal,
      healthCondition,
      experience,
      height,
      weight,
      activityLevel,
      medicalConditions,
      physicalLimitations,
      academiaId: academiaIdParsed
    };

    let preferences;
    
    if (existingPreferences) {
      // Atualizar preferências existentes
      preferences = await prisma.preferenciasAluno.update({
        where: { id: existingPreferences.id },
        data: preferencesData,
      });
    } else {
      // Criar novas preferências
      preferences = await prisma.preferenciasAluno.create({
        data: {
          ...preferencesData,
          userId: targetUserId,
        },
      });
    }

    res.status(200).json({
      message: existingPreferences ? "Preferências atualizadas com sucesso" : "Preferências salvas com sucesso",
      preferences,
    });
  } catch (err) {
    console.error("Erro ao salvar preferências:", err);
    res.status(500).json({ error: "Erro ao salvar preferências" });
  }
});

// ROTAS DE VISUALIZAÇÃO DE TREINOS (ALUNO)

// Obter todos os treinos do aluno
router.get("/aluno/treinos", [isAluno], async (req, res) => {
  try {
    // Buscar preferências do aluno
    const alunoPreferencias = await prisma.preferenciasAluno.findUnique({
      where: { userId: req.userId }
    });

    if (!alunoPreferencias) {
      return res.status(404).json({ error: "Perfil de aluno não encontrado" });
    }

    // Buscar todos os treinos do aluno
    const treinos = await prisma.treino.findMany({
      where: { alunoId: alunoPreferencias.id },
      include: {
        exercicios: true
      },
      orderBy: {
        diaSemana: 'asc'
      }
    });

    // Estruturar os treinos por dia da semana
    const treinosPorDia = {};

    // Inicializar com arrays vazios para cada dia da semana (0-6)
    for (let i = 0; i < 7; i++) {
      treinosPorDia[i] = [];
    }

    // Preencher com os treinos existentes
    treinos.forEach(treino => {
      if (treino.diaSemana >= 0 && treino.diaSemana <= 6) {
        treinosPorDia[treino.diaSemana] = treino.exercicios;
      }
    });

    res.status(200).json(treinosPorDia);
  } catch (err) {
    console.error("Erro ao buscar treinos:", err);
    res.status(500).json({ error: "Erro ao buscar treinos" });
  }
});

// Obter treino específico de um dia da semana
router.get("/aluno/treinos/:diaSemana", [isAluno], async (req, res) => {
  try {
    const { diaSemana } = req.params;

    // Validar dia da semana
    const diaSemanaInt = parseInt(diaSemana);
    if (isNaN(diaSemanaInt) || diaSemanaInt < 0 || diaSemanaInt > 6) {
      return res.status(400).json({ error: "Dia da semana inválido. Deve ser um número entre 0 (Domingo) e 6 (Sábado)" });
    }

    // Buscar preferências do aluno
    const alunoPreferencias = await prisma.preferenciasAluno.findUnique({
      where: { userId: req.userId }
    });

    if (!alunoPreferencias) {
      return res.status(404).json({ error: "Perfil de aluno não encontrado" });
    }

    // Buscar treino do dia específico
    const treino = await prisma.treino.findFirst({
      where: {
        alunoId: alunoPreferencias.id,
        diaSemana: diaSemanaInt
      },
      include: {
        exercicios: true
      }
    });

    if (!treino) {
      return res.status(404).json({ error: "Treino não encontrado para este dia" });
    }

    res.status(200).json(treino);
  } catch (err) {
    console.error("Erro ao buscar treino:", err);
    res.status(500).json({ error: "Erro ao buscar treino" });
  }
});

// Atualizar status de um exercício (completed, inprogress, not-started)
router.patch("/aluno/exercicios/:exercicioId/status", [isAluno], async (req, res) => {
  try {
    const { exercicioId } = req.params;
    const { status } = req.body;

    // Validar status
    const statusValidos = ['completed', 'inprogress', 'not-started'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: "Status inválido. Deve ser 'completed', 'inprogress' ou 'not-started'" });
    }

    // Buscar preferências do aluno
    const alunoPreferencias = await prisma.preferenciasAluno.findUnique({
      where: { userId: req.userId }
    });

    if (!alunoPreferencias) {
      return res.status(404).json({ error: "Perfil de aluno não encontrado" });
    }

    // Buscar exercício com treino
    const exercicio = await prisma.exercicio.findUnique({
      where: {
        id: parseInt(exercicioId)
      },
      include: {
        treino: true
      }
    });

    if (!exercicio) {
      return res.status(404).json({ error: "Exercício não encontrado" });
    }

    // Verificar se o exercício pertence a um treino do aluno
    if (exercicio.treino.alunoId !== alunoPreferencias.id) {
      return res.status(403).json({ error: "Acesso negado. Este exercício não pertence a um treino deste aluno" });
    }

    // Atualizar status do exercício
    const exercicioAtualizado = await prisma.exercicio.update({
      where: {
        id: parseInt(exercicioId)
      },
      data: {
        status
      }
    });

    res.status(200).json({
      message: "Status do exercício atualizado com sucesso",
      exercicio: exercicioAtualizado
    });
  } catch (err) {
    console.error("Erro ao atualizar status do exercício:", err);
    res.status(500).json({ error: "Erro ao atualizar status do exercício" });
  }
});

// Obter relatórios do aluno
router.get("/aluno/meus-reports", [isAluno], async (req, res) => {
  try {
    // Buscar perfil do aluno
    const aluno = await prisma.preferenciasAluno.findUnique({
      where: { userId: req.userId }
    });
    
    if (!aluno) {
      return res.status(404).json({ error: "Perfil de aluno não encontrado" });
    }
    
    // Buscar relatórios do aluno
    const reports = await prisma.report.findMany({
      where: { alunoId: aluno.id },
      orderBy: { data: 'desc' },
      include: {
        personal: {
          select: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    // Agrupar relatórios por tipo
    const reportsByType = {};
    reports.forEach(report => {
      if (!reportsByType[report.tipo]) {
        reportsByType[report.tipo] = [];
      }
      
      reportsByType[report.tipo].push({
        id: report.id,
        valor: report.valor,
        data: report.data,
        observacao: report.observacao,
        personal: report.personal?.user?.name || 'Não especificado'
      });
    });
    
    console.log(`Relatórios encontrados para o aluno ${aluno.id}:`, reportsByType);
    
    res.status(200).json({ reports: reportsByType });
  } catch (err) {
    console.error("Erro ao buscar relatórios:", err);
    res.status(500).json({ error: "Erro ao buscar relatórios" });
  }
});

// Obter eventos da academia do aluno
router.get("/aluno/eventos", [isAluno], async (req, res) => {
  try {
    // Buscar perfil do aluno
    const aluno = await prisma.preferenciasAluno.findUnique({
      where: { userId: req.userId }
    });
    
    if (!aluno) {
      return res.status(404).json({ error: "Perfil de aluno não encontrado" });
    }
    
    if (!aluno.academiaId) {
      return res.status(404).json({ error: "Aluno não está vinculado a nenhuma academia" });
    }
    
    // Filtrar por eventos futuros ou passados
    const { futuros } = req.query;
    let where = {
      academiaId: aluno.academiaId,
      OR: [
        { tipo: "ALUNO" },
        { tipo: "TODOS" }
      ]
    };
    
    // Adicionar filtro de data se solicitado
    if (futuros === 'true') {
      where.dataInicio = { gte: new Date() };
    } else if (futuros === 'false') {
      where.dataFim = { lt: new Date() };
    }
    
    // Buscar eventos
    const eventos = await prisma.evento.findMany({
      where,
      orderBy: { dataInicio: 'asc' }
    });
    
    console.log(`Encontrados ${eventos.length} eventos para o aluno ${aluno.id} da academia ${aluno.academiaId}`);
    
    res.status(200).json(eventos);
  } catch (err) {
    console.error("Erro ao buscar eventos:", err);
    res.status(500).json({ error: "Erro ao buscar eventos" });
  }
});

// Verificar se o aluno já confirmou presença
router.get('/eventos/:eventoId/confirmado', [isAluno], async (req, res) => {
  try {
    const { eventoId } = req.params;
    const userId = req.userId;

    // Verificar se existe confirmação
    const presenca = await prisma.eventoPresenca.findFirst({
      where: {
        eventoId: parseInt(eventoId),
        userId: userId
      }
    });

    return res.json({ confirmado: !!presenca, presenca });
  } catch (error) {
    console.error('Erro ao verificar presença:', error);
    return res.status(500).json({ error: 'Erro ao verificar confirmação de presença' });
  }
});

// Confirmar presença em evento
router.post('/eventos/:eventoId/confirmar', [isAluno], async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { comentario } = req.body;
    const userId = req.userId;

    // Verificar se o evento existe e é visível para o aluno
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: { userId: userId }
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Perfil de aluno não encontrado' });
    }

    const evento = await prisma.evento.findFirst({
      where: {
        id: parseInt(eventoId),
        OR: [
          { tipo: 'ALUNO' },
          { tipo: 'TODOS' }
        ],
        academiaId: aluno.academiaId
      }
    });

    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado ou não disponível para este aluno' });
    }

    // Verificar se já existe uma presença confirmada para atualizar
    const presencaExistente = await prisma.eventoPresenca.findFirst({
      where: {
        eventoId: parseInt(eventoId),
        userId: userId
      }
    });

    let presenca;
    
    if (presencaExistente) {
      // Atualizar presença existente
      presenca = await prisma.eventoPresenca.update({
        where: { id: presencaExistente.id },
        data: { comentario }
      });
    } else {
      // Criar nova presença
      presenca = await prisma.eventoPresenca.create({
        data: {
          eventoId: parseInt(eventoId),
          userId: userId,
          comentario
        }
      });
    }

    return res.status(201).json(presenca);
  } catch (error) {
    console.error('Erro ao confirmar presença:', error);
    return res.status(500).json({ error: 'Erro ao confirmar presença no evento' });
  }
});

// Cancelar presença em evento
router.delete('/eventos/:eventoId/confirmar', [isAluno], async (req, res) => {
  try {
    const { eventoId } = req.params;
    const userId = req.userId;

    // Verificar se existe confirmação
    const presenca = await prisma.eventoPresenca.findFirst({
      where: {
        eventoId: parseInt(eventoId),
        userId: userId
      }
    });

    if (!presenca) {
      return res.status(404).json({ error: 'Confirmação de presença não encontrada' });
    }

    // Remover confirmação
    await prisma.eventoPresenca.delete({
      where: { id: presenca.id }
    });

    return res.json({ message: 'Confirmação de presença cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar presença:', error);
    return res.status(500).json({ error: 'Erro ao cancelar presença no evento' });
  }
});

// Obter estatísticas do dashboard do aluno
router.get("/aluno/dashboard-stats", [isAluno], async (req, res) => {
  try {
    // Buscar preferências do aluno
    const alunoPreferencias = await prisma.preferenciasAluno.findUnique({
      where: { userId: req.userId }
    });

    if (!alunoPreferencias) {
      return res.status(404).json({ error: "Perfil de aluno não encontrado" });
    }

    // Buscar dados de treinos e exercícios para calcular estatísticas
    const treinos = await prisma.treino.findMany({
      where: { alunoId: alunoPreferencias.id },
      include: {
        exercicios: true
      }
    });

    // Calcular passos (baseado em exercícios concluídos e atividades de cardio)
    let steps = 0;
    
    // Para cada exercício concluído, adicionar passos (exemplo simplificado)
    treinos.forEach(treino => {
      treino.exercicios.forEach(exercicio => {
        if (exercicio.status === 'completed') {
          // Exercícios aeróbicos contribuem com mais passos
          if (exercicio.tipo?.toLowerCase().includes('cardio') || 
              exercicio.nome?.toLowerCase().includes('corrida') ||
              exercicio.nome?.toLowerCase().includes('esteira')) {
            steps += 2000; // Exemplo: 2000 passos por exercício de cardio
          } else {
            steps += 500; // Outros exercícios contribuem com menos passos
          }
        }
      });
    });

    // Se não tiver exercícios concluídos, gerar um número aleatório
    if (steps === 0) {
      steps = Math.floor(Math.random() * 5000) + 5000; // Entre 5000 e 10000 passos
    }

    // Calcular calorias (baseado em exercícios)
    let calories = 0;
    
    treinos.forEach(treino => {
      treino.exercicios.forEach(exercicio => {
        if (exercicio.status === 'completed') {
          if (exercicio.calorias) {
            calories += exercicio.calorias;
          } else {
            // Se não tiver calorias definidas, estimar baseado no tipo
            if (exercicio.tipo?.toLowerCase().includes('cardio')) {
              calories += 200; // Exercícios cardio queimam mais calorias
            } else {
              calories += 100; // Outros exercícios
            }
          }
        }
      });
    });

    // Se não tiver exercícios com calorias, gerar um número aleatório
    if (calories === 0) {
      calories = Math.floor(Math.random() * 500) + 500; // Entre 500 e 1000 calorias
    }

    // Calcular progresso geral (porcentagem de exercícios concluídos)
    let totalExercicios = 0;
    let exerciciosConcluidos = 0;
    
    treinos.forEach(treino => {
      totalExercicios += treino.exercicios.length;
      exerciciosConcluidos += treino.exercicios.filter(ex => ex.status === 'completed').length;
    });
    
    let progress = totalExercicios > 0 
      ? Math.round((exerciciosConcluidos / totalExercicios) * 100) 
      : Math.floor(Math.random() * 70) + 10; // Entre 10% e 80% se não tiver dados

    res.status(200).json({
      steps,
      calories,
      progress
    });
  } catch (err) {
    console.error("Erro ao buscar estatísticas do dashboard:", err);
    res.status(500).json({ error: "Erro ao buscar estatísticas do dashboard" });
  }
});

// Obter personal responsável do aluno
router.get("/aluno/personal-responsavel", [isAluno], async (req, res) => {
  try {
    // Buscar preferências do aluno
    const alunoPreferencias = await prisma.preferenciasAluno.findUnique({
      where: { userId: req.userId },
      include: {
        personal: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    if (!alunoPreferencias) {
      return res.status(404).json({ error: "Perfil de aluno não encontrado" });
    }

    if (!alunoPreferencias.personal) {
      return res.status(404).json({ error: "Aluno não possui personal responsável" });
    }

    // Formatar dados do personal para retorno
    const personal = {
      id: alunoPreferencias.personal.user.id,
      name: alunoPreferencias.personal.user.name,
      email: alunoPreferencias.personal.user.email,
      imageUrl: alunoPreferencias.personal.user.imageUrl,
      cref: alunoPreferencias.personal.cref,
      specialization: alunoPreferencias.personal.specialization,
      yearsOfExperience: alunoPreferencias.personal.yearsOfExperience,
      workLocation: alunoPreferencias.personal.workLocation,
      pricePerHour: alunoPreferencias.personal.pricePerHour,
      workSchedule: alunoPreferencias.personal.workSchedule,
      rating: 4.8 // Rating fixo para exemplo, poderia ser calculado com base em avaliações
    };

    res.status(200).json(personal);
  } catch (err) {
    console.error("Erro ao buscar personal responsável:", err);
    res.status(500).json({ error: "Erro ao buscar personal responsável" });
  }
});

export default router; 