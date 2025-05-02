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

export default router; 