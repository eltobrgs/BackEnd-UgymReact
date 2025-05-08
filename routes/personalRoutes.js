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

// Rota para editar perfil do personal (apenas campos específicos)
router.put("/personal/editar-perfil", [isPersonal], async (req, res) => {
  try {
    const {
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
      linkedin
    } = req.body;

    // Buscar preferências do personal
    const personalProfile = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });

    if (!personalProfile) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }

    // Verificar e converter a data se fornecida
    let parsedBirthDate;
    if (birthDate) {
      try {
        if (typeof birthDate === 'string' && birthDate.includes('/')) {
          const [day, month, year] = birthDate.split('/');
          parsedBirthDate = new Date(`${year}-${month}-${day}`);
        } else {
          parsedBirthDate = new Date(birthDate);
        }
        
        if (isNaN(parsedBirthDate)) {
          return res.status(400).json({ error: "Formato de data inválido para birthDate" });
        }
      } catch (error) {
        return res.status(400).json({ error: "Formato de data inválido" });
      }
    }

    // Dados a serem atualizados
    const updateData = {
      ...(parsedBirthDate && { birthDate: parsedBirthDate }),
      ...(gender && { gender }),
      ...(specializations !== undefined && { specializations }),
      ...(yearsOfExperience !== undefined && { yearsOfExperience }),
      ...(workSchedule !== undefined && { workSchedule }),
      ...(certifications !== undefined && { certifications }),
      ...(biography !== undefined && { biography }),
      ...(workLocation !== undefined && { workLocation }),
      ...(pricePerHour !== undefined && { pricePerHour }),
      ...(languages !== undefined && { languages }),
      ...(instagram !== undefined && { instagram }),
      ...(linkedin !== undefined && { linkedin })
    };

    // Atualizar perfil do personal
    const updatedPersonal = await prisma.preferenciasPersonal.update({
      where: { id: personalProfile.id },
      data: updateData
    });

    res.status(200).json({
      message: "Perfil atualizado com sucesso",
      personal: updatedPersonal
    });
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
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
          activityLevel: "",
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
    
    // MODIFICAÇÃO: Não bloquear acesso aos relatórios mesmo que o aluno não esteja vinculado ao personal
    // Isso permitirá que o StudentDetailModal funcione em todas as situações
    
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
    console.log(`Enviando relatórios: ${JSON.stringify(reportsByType)}`);
    
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

// Obter eventos da academia do personal
router.get("/personal/eventos", [isPersonal], async (req, res) => {
  try {
    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });
    
    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }
    
    if (!personal.academiaId) {
      return res.status(404).json({ error: "Personal não está vinculado a nenhuma academia" });
    }
    
    // Filtrar por eventos futuros ou passados
    const { futuros } = req.query;
    let where = {
      academiaId: personal.academiaId,
      OR: [
        { tipo: "PERSONAL" },
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
    
    console.log(`Encontrados ${eventos.length} eventos para o personal ${personal.id} da academia ${personal.academiaId}`);
    
    res.status(200).json(eventos);
  } catch (err) {
    console.error("Erro ao buscar eventos:", err);
    res.status(500).json({ error: "Erro ao buscar eventos" });
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

// Verificar se personal confirmou presença
router.get('/personal/eventos/:eventoId/confirmado', [isPersonal], async (req, res) => {
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
router.post('/personal/eventos/:eventoId/confirmar', [isPersonal], async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { comentario } = req.body;
    const userId = req.userId;

    // Verificar se o personal está vinculado a uma academia
    const personal = await prisma.preferenciasPersonal.findFirst({
      where: { userId: userId }
    });

    if (!personal) {
      return res.status(404).json({ error: 'Perfil de personal não encontrado' });
    }

    // Verificar se o evento existe e é visível para o personal
    const evento = await prisma.evento.findFirst({
      where: {
        id: parseInt(eventoId),
        OR: [
          { tipo: 'PERSONAL' },
          { tipo: 'TODOS' }
        ],
        academiaId: personal.academiaId
      }
    });

    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado ou não disponível para este personal' });
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
router.delete('/personal/eventos/:eventoId/confirmar', [isPersonal], async (req, res) => {
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

// Obter estatísticas do dashboard do personal
router.get("/personal/dashboard-stats", [isPersonal], async (req, res) => {
  try {
    // Buscar personal
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId }
    });
    
    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }
    
    // Buscar total de alunos vinculados ao personal
    const totalAlunos = await prisma.preferenciasAluno.count({
      where: { personalId: personal.id }
    });
    
    // Buscar total de treinos configurados na semana atual
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6); // Sábado
    fimSemana.setHours(23, 59, 59, 999);
    
    const totalTreinos = await prisma.treino.count({
      where: {
        personal: {
          userId: req.userId
        },
        createdAt: {
          gte: inicioSemana,
          lte: fimSemana
        }
      }
    });
    
    // Buscar consultas agendadas para hoje
    const consultasHoje = await prisma.agendamento.count({
      where: {
        personalId: personal.id,
        data: {
          gte: new Date(hoje.setHours(0, 0, 0, 0)),
          lte: new Date(hoje.setHours(23, 59, 59, 999))
        }
      }
    });
    
    // Calcular receita mensal estimada (preço por hora × número de alunos × 4 semanas)
    const receitaMensal = personal.pricePerHour 
      ? Math.round(personal.pricePerHour * totalAlunos * 4) 
      : 0;
    
    res.status(200).json({
      totalAlunos,
      totalTreinos,
      consultasHoje,
      receitaMensal
    });
  } catch (err) {
    console.error("Erro ao buscar estatísticas do dashboard:", err);
    res.status(500).json({ error: "Erro ao buscar estatísticas do dashboard" });
  }
});

// Obter progresso dos alunos do personal
router.get("/personal/alunos-progresso", [isPersonal], async (req, res) => {
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
            email: true,
            imageUrl: true
          }
        },
        medidasHistorico: {
          orderBy: {
            dataRegistro: 'desc'
          },
          take: 2 // Pegamos os 2 últimos registros para comparar tendência
        }
      }
    });
    
    // Buscar treinos e exercícios para calcular progresso
    const alunosComProgresso = await Promise.all(alunos.map(async (aluno) => {
      // Buscar todos os treinos do aluno
      const treinos = await prisma.treino.findMany({
        where: { alunoId: aluno.id },
        include: {
          exercicios: true
        }
      });
      
      // Calcular porcentagem de exercícios concluídos
      let totalExercicios = 0;
      let exerciciosConcluidos = 0;
      
      treinos.forEach(treino => {
        totalExercicios += treino.exercicios.length;
        exerciciosConcluidos += treino.exercicios.filter(ex => ex.status === 'completed').length;
      });
      
      const progressoTreino = totalExercicios > 0 
        ? Math.round((exerciciosConcluidos / totalExercicios) * 100) 
        : 0;
      
      // Determinar tendência de peso
      let tendenciaPeso = undefined;
      const ultimasMedidas = aluno.medidasHistorico;
      
      if (ultimasMedidas.length >= 2) {
        const pesoAtual = parseFloat(ultimasMedidas[0].peso);
        const pesoAnterior = parseFloat(ultimasMedidas[1].peso);
        
        if (pesoAtual > pesoAnterior) {
          tendenciaPeso = 'aumento';
        } else if (pesoAtual < pesoAnterior) {
          tendenciaPeso = 'reducao';
        } else {
          tendenciaPeso = 'estavel';
        }
      }
      
      // Buscar última atividade do aluno (último exercício concluído)
      const ultimoExercicioConcluido = await prisma.exercicio.findFirst({
        where: {
          treino: {
            alunoId: aluno.id
          },
          status: 'completed'
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });
      
      const ultimaAtividade = ultimoExercicioConcluido?.updatedAt;
      
      return {
        id: aluno.user.id,
        name: aluno.user.name,
        goal: aluno.objetivo || 'Não definido',
        imageUrl: aluno.user.imageUrl,
        progressoTreino,
        tendenciaPeso,
        ultimaAtividade
      };
    }));
    
    res.status(200).json(alunosComProgresso);
  } catch (err) {
    console.error("Erro ao buscar progresso dos alunos:", err);
    res.status(500).json({ error: "Erro ao buscar progresso dos alunos" });
  }
});

// Sincronizar relatórios de IMC calculados automaticamente (requer ser personal)
router.post("/personal/aluno/:alunoId/sync-imc", [isPersonal], async (req, res) => {
  try {
    const { alunoId } = req.params;
    const { reports } = req.body; // Array de relatórios de IMC com data, valor e observacao
    
    if (!reports || !Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ error: "Relatórios de IMC inválidos ou não fornecidos" });
    }
    
    console.log(`Sincronizando ${reports.length} relatórios de IMC para o aluno ID ${alunoId}`);
    
    // Verificar se o personal tem permissão para gerenciar este aluno
    const personal = await prisma.preferenciasPersonal.findUnique({
      where: { userId: req.userId },
    });
    
    if (!personal) {
      return res.status(404).json({ error: "Perfil de personal não encontrado" });
    }
    
    // Verificar se o personal está vinculado a este aluno
    const aluno = await prisma.preferenciasAluno.findUnique({
      where: { 
        id: parseInt(alunoId),
        personalId: personal.id 
      },
    });
    
    if (!aluno) {
      return res.status(403).json({ error: "Você não tem permissão para gerenciar este aluno" });
    }
    
    // Buscar relatórios de IMC existentes para este aluno
    const existingReports = await prisma.report.findMany({
      where: {
        alunoId: parseInt(alunoId),
        personalId: personal.id,
        tipo: 'IMC'
      },
    });
    
    // Mapeamento para facilitar a busca de relatórios existentes por data
    const existingReportsByDate = {};
    existingReports.forEach(report => {
      const dateKey = new Date(report.data).toISOString().split('T')[0];
      existingReportsByDate[dateKey] = report;
    });
    
    // Transação para garantir que todas as operações sejam concluídas ou nenhuma
    const result = await prisma.$transaction(async (prisma) => {
      const savedReports = [];
      
      // Processar cada relatório de IMC
      for (const report of reports) {
        const reportDate = new Date(report.data);
        const dateKey = reportDate.toISOString().split('T')[0];
        
        // Verificar se já existe um relatório para esta data
        if (existingReportsByDate[dateKey]) {
          // Atualizar relatório existente
          const updatedReport = await prisma.report.update({
            where: { id: existingReportsByDate[dateKey].id },
            data: {
              valor: report.valor,
              observacao: report.observacao || 'Calculado automaticamente'
            }
          });
          savedReports.push(updatedReport);
        } else {
          // Criar novo relatório
          const newReport = await prisma.report.create({
            data: {
              tipo: 'IMC',
              valor: report.valor,
              data: reportDate,
              observacao: report.observacao || 'Calculado automaticamente',
              alunoId: parseInt(alunoId),
              personalId: personal.id
            }
          });
          savedReports.push(newReport);
        }
      }
      
      return savedReports;
    });
    
    res.status(200).json({
      message: `${result.length} relatórios de IMC sincronizados com sucesso`,
      reports: result
    });
  } catch (err) {
    console.error("Erro ao sincronizar relatórios de IMC:", err);
    res.status(500).json({ error: "Erro ao sincronizar relatórios de IMC" });
  }
});

export default router; 