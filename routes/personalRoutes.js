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

// Middleware para verificar se o usuário é personal
const isPersonal = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'PERSONAL') {
      return res.status(403).json({ error: "Acesso negado. Apenas personal trainers podem acessar esta funcionalidade" });
    }

    next();
  } catch (err) {
    console.error("Erro ao verificar perfil de usuário:", err);
    return res.status(500).json({ error: "Erro ao verificar perfil de usuário" });
  }
};

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Buscar dados de um personal específico
router.get("/personal/detalhes/:personalId", async (req, res) => {
  try {
    const { personalId } = req.params;

    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: parseInt(personalId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!personal) {
      return res.status(404).json({ error: "Personal não encontrado" });
    }

    // Formatar data para exibição
    const formattedBirthDate = new Date(personal.birthDate).toLocaleDateString('pt-BR');

    res.status(200).json({
      ...personal,
      birthDate: formattedBirthDate
    });
  } catch (err) {
    console.error("Erro ao buscar dados do personal:", err);
    res.status(500).json({ error: "Erro ao buscar dados do personal" });
  }
});

// Salvar/atualizar dados do perfil do personal (requer ser personal)
router.post("/personal/preferencias", [isPersonal], async (req, res) => {
  try {
    const {
      cref, 
      specialization, 
      birthDate,
      gender,
      specializations,
      yearsOfExperience,
      workSchedule,
      certifications,
      biography,
      workLocation,
      pricePerHour,
      languages,
      instagram,
      linkedin,
      academiaId
    } = req.body;

    // Verificar e converter a data
    const [day, month, year] = birthDate.split('/');
    const parsedBirthDate = new Date(`${year}-${month}-${day}`);

    if (isNaN(parsedBirthDate)) {
      return res.status(400).json({ error: "Formato de data inválido para birthDate. Use DD/MM/YYYY" });
    }

    // Buscar usuário e verificar se é personal
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { preferenciasPersonal: true }
    });

    if (!user || user.role !== 'PERSONAL') {
      return res.status(403).json({ error: "Acesso negado. Apenas personal trainers podem acessar esta funcionalidade" });
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

    // Dados a serem salvos/atualizados
    const personalData = {
      cref,
      specialization,
      birthDate: parsedBirthDate.toISOString(),
      gender,
      specializations,
      yearsOfExperience,
      workSchedule,
      certifications,
      biography,
      workLocation,
      pricePerHour,
      languages,
      instagram,
      linkedin,
      academiaId: academiaIdParsed
    };

    // Atualizar dados do personal
    const updatedPersonal = await prisma.preferenciasPersonal.update({
      where: { userId: user.id },
      data: personalData,
    });

    res.status(200).json({
      message: "Perfil de personal atualizado com sucesso",
      personal: updatedPersonal
    });
  } catch (err) {
    console.error("Erro ao salvar perfil de personal:", err);
    res.status(500).json({ error: "Erro ao salvar perfil de personal" });
  }
});

// Listar alunos vinculados ao personal (requer ser personal)
router.get("/personal/meus-alunos", [isPersonal], async (req, res) => {
  try {
    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId },
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Buscar alunos vinculados ao personal
    const students = await prisma.user.findMany({
      where: {
        preferenciasAluno: {
          personalId: personal.id
        }
      },
      include: {
        preferenciasAluno: true
      }
    });

    // Formatar dados para exibição
    const formattedStudents = students.map(student => {
      const age = student.preferenciasAluno?.birthDate
        ? Math.floor((new Date() - new Date(student.preferenciasAluno.birthDate)) / (1000 * 60 * 60 * 24 * 365.25))
        : null;

      return {
        id: student.preferenciasAluno.id,
        userId: student.id,
        name: student.name,
        email: student.email,
        age: age || 'Não informado',
        weight: student.preferenciasAluno?.weight || 'Não informado',
        height: student.preferenciasAluno?.height || 'Não informado',
        goal: student.preferenciasAluno?.goal || 'Não informado',
        trainingTime: student.preferenciasAluno?.experience || 'Iniciante'
      };
    });

    console.log('Total de alunos encontrados:', formattedStudents.length);

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Erro ao buscar alunos:", err);
    res.status(500).json({ error: "Erro ao buscar alunos" });
  }
});

// Adicionar aluno ao personal (requer ser personal)
router.post("/personal/adicionar-aluno/:alunoId", [isPersonal], async (req, res) => {
  try {
    const { alunoId } = req.params;
  
    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId },
    });
  
    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }
  
    // Buscar aluno
    const student = await prisma.user.findUnique({
      where: {
        id: parseInt(alunoId),
        role: 'ALUNO'
      }
    });
  
    if (!student) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }
  
    // Verificar se o aluno já está vinculado a este personal
    const existingPreferences = await prisma.preferenciasAluno.findUnique({
      where: { userId: parseInt(alunoId) },
    });
  
    if (existingPreferences?.personalId === personal.id) {
      return res.status(400).json({ error: "Este aluno já está vinculado ao seu perfil" });
    }
  
    // Vincular aluno ao personal
    if (existingPreferences) {
      await prisma.preferenciasAluno.update({
        where: { id: existingPreferences.id },
        data: { personalId: personal.id }
      });
    } else {
      await prisma.preferenciasAluno.create({
        data: {
          userId: parseInt(alunoId),
          personalId: personal.id,
          birthDate: new Date(),
          gender: "",
          goal: "",
          healthCondition: "",
          experience: "",
          height: "",
          weight: "",
          activityLevel: "",
          medicalConditions: "",
          physicalLimitations: ""
        }
      });
    }
  
    res.status(200).json({ message: "Aluno adicionado com sucesso" });
  } catch (err) {
    console.error("Erro ao adicionar aluno:", err);
    res.status(500).json({ error: "Erro ao adicionar aluno" });
  }
});

// ROTAS DE GERENCIAMENTO DE TREINOS (PERSONAL)

// Obter todos os treinos dos alunos vinculados ao personal
router.get("/personal/treinos", [isPersonal], async (req, res) => {
  try {
    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Buscar alunos vinculados ao personal
    const alunos = await prisma.preferenciasAluno.findMany({
      where: { personalId: personal.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        treinos: {
          include: {
            exercicios: true
          }
        }
      }
    });

    // Formatar dados para resposta
    const result = alunos.map(aluno => ({
      alunoId: aluno.id,
      userId: aluno.user.id,
      nome: aluno.user.name,
      email: aluno.user.email,
      treinos: aluno.treinos.map(treino => ({
        id: treino.id,
        diaSemana: treino.diaSemana,
        exercicios: treino.exercicios
      }))
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Erro ao buscar treinos:", err);
    res.status(500).json({ error: "Erro ao buscar treinos" });
  }
});

// Obter treino específico de um aluno
router.get("/personal/treinos/:alunoId/:diaSemana", [isPersonal], async (req, res) => {
  try {
    const { alunoId, diaSemana } = req.params;

    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Verificar se o aluno está vinculado ao personal
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: {
        id: parseInt(alunoId),
        personalId: personal.id
      }
    });

    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado ou não está vinculado a este personal" });
    }

    // Buscar treino do dia específico
    const treino = await prisma.treino.findFirst({
      where: {
        alunoId: parseInt(alunoId),
        diaSemana: parseInt(diaSemana)
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

// Criar ou atualizar treino para um aluno
router.post("/personal/treinos/:alunoId/:diaSemana", [isPersonal], async (req, res) => {
  try {
    const { alunoId, diaSemana } = req.params;
    const { exercicios } = req.body;

    if (!exercicios || !Array.isArray(exercicios)) {
      return res.status(400).json({ error: "Exercícios não fornecidos ou formato inválido" });
    }

    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Verificar se o aluno está vinculado ao personal
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: {
        id: parseInt(alunoId),
        personalId: personal.id
      }
    });

    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado ou não está vinculado a este personal" });
    }

    // Verificar se já existe treino para este dia
    const treinoExistente = await prisma.treino.findFirst({
      where: {
        alunoId: parseInt(alunoId),
        diaSemana: parseInt(diaSemana)
      },
      include: {
        exercicios: true
      }
    });

    let novoTreino;

    if (treinoExistente) {
      // Excluir exercícios existentes
      await prisma.exercicio.deleteMany({
        where: {
          treinoId: treinoExistente.id
        }
      });

      // Atualizar treino e adicionar novos exercícios
      novoTreino = await prisma.treino.update({
        where: {
          id: treinoExistente.id
        },
        data: {
          exercicios: {
            create: exercicios
          }
        },
        include: {
          exercicios: true
        }
      });
    } else {
      // Criar novo treino com exercícios
      novoTreino = await prisma.treino.create({
        data: {
          diaSemana: parseInt(diaSemana),
          alunoId: parseInt(alunoId),
          exercicios: {
            create: exercicios
          }
        },
        include: {
          exercicios: true
        }
      });
    }

    res.status(200).json({
      message: treinoExistente ? "Treino atualizado com sucesso" : "Treino criado com sucesso",
      treino: novoTreino
    });
  } catch (err) {
    console.error("Erro ao criar/atualizar treino:", err);
    res.status(500).json({ error: "Erro ao criar/atualizar treino" });
  }
});

// Excluir treino de um aluno
router.delete("/personal/treinos/:alunoId/:diaSemana", [isPersonal], async (req, res) => {
  try {
    const { alunoId, diaSemana } = req.params;

    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Verificar se o aluno está vinculado ao personal
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: {
        id: parseInt(alunoId),
        personalId: personal.id
      }
    });

    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado ou não está vinculado a este personal" });
    }

    // Buscar treino do dia específico
    const treino = await prisma.treino.findFirst({
      where: {
        alunoId: parseInt(alunoId),
        diaSemana: parseInt(diaSemana)
      }
    });

    if (!treino) {
      return res.status(404).json({ error: "Treino não encontrado para este dia" });
    }

    // Excluir treino (os exercícios serão excluídos automaticamente pela cascata)
    await prisma.treino.delete({
      where: {
        id: treino.id
      }
    });

    res.status(200).json({
      message: "Treino excluído com sucesso"
    });
  } catch (err) {
    console.error("Erro ao excluir treino:", err);
    res.status(500).json({ error: "Erro ao excluir treino" });
  }
});

// Adicionar um exercício a um treino existente
router.post("/personal/treinos/:treinoId/exercicios", [isPersonal], async (req, res) => {
  try {
    const { treinoId } = req.params;
    const exercicioData = req.body;

    // Verificar dados do exercício
    if (!exercicioData.name || !exercicioData.sets || !exercicioData.time || 
        !exercicioData.restTime || !exercicioData.repsPerSet || !exercicioData.status || 
        !exercicioData.image) {
      return res.status(400).json({ error: "Dados do exercício incompletos" });
    }

    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Buscar treino
    const treino = await prisma.treino.findUnique({
      where: {
        id: parseInt(treinoId)
      },
      include: {
        aluno: true
      }
    });

    if (!treino) {
      return res.status(404).json({ error: "Treino não encontrado" });
    }

    // Verificar se o aluno do treino está vinculado ao personal
    if (treino.aluno.personalId !== personal.id) {
      return res.status(403).json({ error: "Acesso negado. Este treino pertence a um aluno não vinculado a este personal" });
    }

    // Adicionar exercício
    const novoExercicio = await prisma.exercicio.create({
      data: {
        ...exercicioData,
        treinoId: parseInt(treinoId)
      }
    });

    res.status(201).json({
      message: "Exercício adicionado com sucesso",
      exercicio: novoExercicio
    });
  } catch (err) {
    console.error("Erro ao adicionar exercício:", err);
    res.status(500).json({ error: "Erro ao adicionar exercício" });
  }
});

// Atualizar um exercício específico
router.put("/personal/exercicios/:exercicioId", [isPersonal], async (req, res) => {
  try {
    const { exercicioId } = req.params;
    const exercicioData = req.body;

    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Buscar exercício com treino e aluno
    const exercicio = await prisma.exercicio.findUnique({
      where: {
        id: parseInt(exercicioId)
      },
      include: {
        treino: {
          include: {
            aluno: true
          }
        }
      }
    });

    if (!exercicio) {
      return res.status(404).json({ error: "Exercício não encontrado" });
    }

    // Verificar se o aluno do treino está vinculado ao personal
    if (exercicio.treino.aluno.personalId !== personal.id) {
      return res.status(403).json({ error: "Acesso negado. Este exercício pertence a um treino de um aluno não vinculado a este personal" });
    }

    // Atualizar exercício
    const exercicioAtualizado = await prisma.exercicio.update({
      where: {
        id: parseInt(exercicioId)
      },
      data: exercicioData
    });

    res.status(200).json({
      message: "Exercício atualizado com sucesso",
      exercicio: exercicioAtualizado
    });
  } catch (err) {
    console.error("Erro ao atualizar exercício:", err);
    res.status(500).json({ error: "Erro ao atualizar exercício" });
  }
});

// Excluir um exercício específico
router.delete("/personal/exercicios/:exercicioId", [isPersonal], async (req, res) => {
  try {
    const { exercicioId } = req.params;

    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Buscar exercício com treino e aluno
    const exercicio = await prisma.exercicio.findUnique({
      where: {
        id: parseInt(exercicioId)
      },
      include: {
        treino: {
          include: {
            aluno: true
          }
        }
      }
    });

    if (!exercicio) {
      return res.status(404).json({ error: "Exercício não encontrado" });
    }

    // Verificar se o aluno do treino está vinculado ao personal
    if (exercicio.treino.aluno.personalId !== personal.id) {
      return res.status(403).json({ error: "Acesso negado. Este exercício pertence a um treino de um aluno não vinculado a este personal" });
    }

    // Excluir exercício
    await prisma.exercicio.delete({
      where: {
        id: parseInt(exercicioId)
      }
    });

    res.status(200).json({
      message: "Exercício excluído com sucesso"
    });
  } catch (err) {
    console.error("Erro ao excluir exercício:", err);
    res.status(500).json({ error: "Erro ao excluir exercício" });
  }
});

// Listar relatórios de um aluno específico (requer ser personal)
router.get("/personal/aluno/:alunoId/reports", [isPersonal], async (req, res) => {
  try {
    const { alunoId } = req.params;
    console.log(`Personal ${req.userId} buscando relatórios do aluno ${alunoId}`);
    
    // Verificar se o personal tem acesso a este aluno
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId },
      include: {
        students: true
      }
    });
    
    if (!personal) {
      console.log("Perfil de personal não encontrado");
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }
    
    console.log(`Personal ID: ${personal.id}, alunos vinculados: [${personal.students.map(a => a.id).join(', ')}]`);
    
    // Verificar se o aluno existe
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: { 
        id: parseInt(alunoId)
      },
      include: {
        personal: true
      }
    });
    
    if (!aluno) {
      console.log(`Aluno com ID ${alunoId} não encontrado`);
      return res.status(404).json({ error: "Aluno não encontrado" });
    }
    
    console.log(`Aluno encontrado, personalId: ${aluno.personalId}, personal atual: ${personal.id}`);
    
    // Verificar se o aluno está vinculado a este personal
    if (aluno.personalId !== personal.id) {
      console.log(`Aluno vinculado ao personal ${aluno.personalId} e não ao personal ${personal.id}`);
      
      // Atualizar vinculação do aluno ao personal atual
      console.log(`Tentando atualizar vinculação do aluno ${alunoId} ao personal ${personal.id}`);
      try {
        await prisma.preferenciasAluno.update({
          where: { id: parseInt(alunoId) },
          data: { personalId: personal.id }
        });
        console.log(`Vinculação atualizada com sucesso`);
      } catch (updateError) {
        console.error(`Erro ao atualizar vinculação:`, updateError);
        return res.status(403).json({ 
          error: "Este aluno não está vinculado ao seu perfil",
          debug: {
            alunoPersonalId: aluno.personalId,
            seuPersonalId: personal.id
          }
        });
      }
    }
    
    // Buscar relatórios do aluno
    const reports = await prisma.report.findMany({
      where: { alunoId: parseInt(alunoId) },
      orderBy: { data: 'desc' }
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
        observacao: report.observacao
      });
    });
    
    console.log(`Relatórios encontrados para o aluno ${alunoId}: ${reports.length}`);
    
    res.status(200).json({ reports: reportsByType });
  } catch (err) {
    console.error(`Erro ao buscar relatórios do aluno ${req.params.alunoId}:`, err);
    res.status(500).json({ error: "Erro ao buscar relatórios do aluno" });
  }
});

// Endpoint para listar todos os alunos do personal com seus IDs (para diagnóstico)
router.get("/personal/debug/alunos", [isPersonal], async (req, res) => {
  try {
    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    const result = {
      personal: {
        id: personal.id,
        userId: personal.userId,
        name: personal.user.name,
        email: personal.user.email
      },
      alunos: personal.students.map(aluno => ({
        id: aluno.id,
        userId: aluno.userId,
        name: aluno.user.name,
        email: aluno.user.email
      }))
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Erro ao listar alunos:", err);
    res.status(500).json({ error: "Erro ao listar alunos" });
  }
});

// Criar ou atualizar relatório de um aluno (requer ser personal)
router.post("/personal/aluno/:alunoId/reports", [isPersonal], async (req, res) => {
  try {
    const { alunoId } = req.params;
    const { id, tipo, valor, data, observacao } = req.body;
    
    if (!tipo || valor === undefined) {
      return res.status(400).json({ error: "Tipo e valor são campos obrigatórios" });
    }
    
    // Verificar se o personal tem acesso a este aluno
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });
    
    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }
    
    // Verificar se o aluno existe
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: { 
        id: parseInt(alunoId)
      }
    });
    
    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }
    
    // Verificar e atualizar vinculação se necessário
    if (aluno.personalId !== personal.id) {
      console.log(`Aluno ${alunoId} não está vinculado ao personal ${personal.id}. Atualizando vinculação.`);
      try {
        await prisma.preferenciasAluno.update({
          where: { id: parseInt(alunoId) },
          data: { personalId: personal.id }
        });
        console.log(`Vinculação atualizada com sucesso`);
      } catch (updateError) {
        console.error(`Erro ao atualizar vinculação:`, updateError);
        return res.status(403).json({ error: "Este aluno não está vinculado ao seu perfil" });
      }
    }
    
    let report;
    
    // Converter a data se for fornecida
    let parsedDate = new Date();
    if (data) {
      if (typeof data === 'string' && data.includes('/')) {
        const [day, month, year] = data.split('/');
        parsedDate = new Date(`${year}-${month}-${day}`);
      } else {
        parsedDate = new Date(data);
      }
      
      if (isNaN(parsedDate)) {
        return res.status(400).json({ error: "Formato de data inválido. Use DD/MM/YYYY" });
      }
    }
    
    // Lógica para atualizar ou criar relatório
    if (id) {
      const existingReport = await prisma.report.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!existingReport || existingReport.alunoId !== parseInt(alunoId)) {
        return res.status(404).json({ error: "Relatório não encontrado" });
      }
      
      report = await prisma.report.update({
        where: { id: parseInt(id) },
        data: {
          tipo,
          valor: parseFloat(valor),
          data: parsedDate,
          observacao,
          personalId: personal.id
        }
      });
      
      console.log(`Relatório ${id} atualizado para o aluno ${alunoId}:`, report);
    } else {
      report = await prisma.report.create({
        data: {
          tipo,
          valor: parseFloat(valor),
          data: parsedDate,
          observacao,
          alunoId: parseInt(alunoId),
          personalId: personal.id
        }
      });
      
      console.log(`Novo relatório criado para o aluno ${alunoId}:`, report);
    }
    
    res.status(200).json({
      message: id ? "Relatório atualizado com sucesso" : "Relatório criado com sucesso",
      report
    });
  } catch (err) {
    console.error(`Erro ao ${req.body.id ? 'atualizar' : 'criar'} relatório para o aluno ${req.params.alunoId}:`, err);
    res.status(500).json({ error: `Erro ao ${req.body.id ? 'atualizar' : 'criar'} relatório` });
  }
});

export default router; 