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
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};

// Aplicar middleware de autenticação em todas as rotas privadas
router.use(authenticate);

// Buscar dados do usuário logado
router.get("/me", async (req, res) => {
  try {
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { 
        id: true, 
        name: true, 
        email: true,
        role: true 
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Erro ao buscar dados do usuário:", err);
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

// Salvar/atualizar preferências do aluno
router.post("/preferences", async (req, res) => {
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
      physicalLimitations 
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

    // Verificar se já existem preferências
    const existingPreferences = await prisma.preferenciasAluno.findUnique({
      where: { userId: user.id },
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
      userId: user.id,
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

// Buscar preferências do usuário logado
router.get("/preferences", async (req, res) => {
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Buscar preferências
    const preferences = await prisma.preferenciasAluno.findUnique({
      where: { userId: user.id },
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

// Salvar/atualizar dados do perfil do personal
router.post("/personal-preferences", async (req, res) => {
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
      linkedin
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

// Listar alunos vinculados ao personal
router.get("/my-students", async (req, res) => {
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
        id: student.id,
        name: student.name,
        email: student.email,
        age: age || 'Não informado',
        weight: student.preferenciasAluno?.weight || 'Não informado',
        height: student.preferenciasAluno?.height || 'Não informado',
        goal: student.preferenciasAluno?.goal || 'Não informado',
        trainingTime: student.preferenciasAluno?.experience || 'Iniciante'
      };
    });

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Erro ao buscar alunos:", err);
    res.status(500).json({ error: "Erro ao buscar alunos" });
  }
});

// Listar todos os alunos (para personal)
router.get("/all-students", async (req, res) => {
  try {
    // Buscar todos os alunos
    const students = await prisma.user.findMany({
      where: {
        role: 'ALUNO',
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
        id: student.id,
        name: student.name,
        email: student.email,
        age: age || 'Não informado',
        weight: student.preferenciasAluno?.weight || 'Não informado',
        height: student.preferenciasAluno?.height || 'Não informado',
        goal: student.preferenciasAluno?.goal || 'Não informado',
        trainingTime: student.preferenciasAluno?.experience || 'Iniciante'
      };
    });

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Erro ao buscar alunos:", err);
    res.status(500).json({ error: "Erro ao buscar alunos" });
  }
});

// Adicionar aluno ao personal
router.post("/add-student/:studentId", async (req, res) => {
    try {
    const { studentId } = req.params;
  
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
        id: parseInt(studentId),
        role: 'ALUNO'
        }
      });
  
      if (!student) {
      return res.status(404).json({ error: "Aluno não encontrado" });
      }
  
      // Verificar se o aluno já está vinculado a este personal
    const existingPreferences = await prisma.preferenciasAluno.findUnique({
      where: { userId: parseInt(studentId) },
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
          userId: parseInt(studentId),
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

// Buscar dados de um personal específico
router.get("/personal/:personalId", async (req, res) => {
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

// Listar todos os personals
router.get("/personals", async (req, res) => {
  try {
    // Buscar todos os personals
    const personals = await prisma.user.findMany({
      where: {
        role: 'PERSONAL',
      },
      include: {
        preferenciasPersonal: true
      }
    });

    // Formatar dados para exibição
    const formattedPersonals = personals.map(personal => {
      const age = personal.preferenciasPersonal?.birthDate
        ? Math.floor((new Date() - new Date(personal.preferenciasPersonal.birthDate)) / (1000 * 60 * 60 * 24 * 365.25))
        : null;

      return {
        id: personal.id,
        name: personal.name,
        email: personal.email,
        age: age || 'Não informado',
        weight: personal.preferenciasPersonal?.weight || 'Não informado',
        height: personal.preferenciasPersonal?.height || 'Não informado',
        goal: personal.preferenciasPersonal?.goal || 'Não informado',
        trainingTime: personal.preferenciasPersonal?.experience || 'Iniciante'
      };
    });

    res.status(200).json(formattedPersonals);
  } catch (err) {
    console.error("Erro ao buscar personals:", err);
    res.status(500).json({ error: "Erro ao buscar personals" });
  }
});

// Rota para cadastrar/atualizar dados da academia
router.post("/academia-profile", async (req, res) => {
  try {
    const { 
      cnpj, 
      endereco, 
      telefone, 
      horarioFuncionamento, 
      descricao, 
      comodidades, 
      planos, 
      website, 
      instagram, 
      facebook 
    } = req.body;

    // Buscar usuário e verificar se é academia
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user || user.role !== 'ACADEMIA') {
      return res.status(403).json({ error: "Acesso negado. Apenas academias podem acessar esta funcionalidade" });
    }

    // Dados a serem salvos/atualizados
    const academiaData = {
      cnpj,
      endereco,
      telefone,
      horarioFuncionamento,
      descricao,
      comodidades,
      planos,
      website,
      instagram,
      facebook
    };

    let academia;

    if (user.academia) {
      // Atualizar dados da academia
      academia = await prisma.academia.update({
        where: { userId: user.id },
        data: academiaData,
      });
    } else {
      // Criar novo perfil de academia
      academia = await prisma.academia.create({
        data: {
          ...academiaData,
          userId: user.id
        },
      });
    }

    res.status(200).json({
      message: user.academia ? "Perfil de academia atualizado com sucesso" : "Perfil de academia criado com sucesso",
      academia
    });
  } catch (err) {
    console.error("Erro ao salvar perfil de academia:", err);
    res.status(500).json({ error: "Erro ao salvar perfil de academia" });
  }
});

// Buscar dados da academia logada
router.get("/academia-profile", async (req, res) => {
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user || user.role !== 'ACADEMIA') {
      return res.status(403).json({ error: "Acesso negado. Apenas academias podem acessar esta funcionalidade" });
    }

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    res.status(200).json(user.academia);
  } catch (err) {
    console.error("Erro ao buscar dados da academia:", err);
    res.status(500).json({ error: "Erro ao buscar dados da academia" });
  }
});

// Listar todas as academias
router.get("/academias", async (req, res) => {
  try {
    // Buscar todas as academias
    const academias = await prisma.user.findMany({
      where: {
        role: 'ACADEMIA',
      },
      include: {
        academia: true
      }
    });

    // Formatar dados para exibição
    const formattedAcademias = academias.map(user => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        nomeFantasia: user.academia?.nomeFantasia || user.name,
        endereco: user.academia?.endereco || 'Não informado',
        telefone: user.academia?.telefone || 'Não informado',
        horarioFuncionamento: user.academia?.horarioFuncionamento || 'Não informado'
      };
    });

    res.status(200).json(formattedAcademias);
  } catch (err) {
    console.error("Erro ao buscar academias:", err);
    res.status(500).json({ error: "Erro ao buscar academias" });
  }
});

// Buscar dados de uma academia específica
router.get("/academia/:academiaId", async (req, res) => {
  try {
    const { academiaId } = req.params;

    // Buscar academia
    const academia = await prisma.academia.findUnique({
      where: { userId: parseInt(academiaId) },
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

    if (!academia) {
      return res.status(404).json({ error: "Academia não encontrada" });
    }

    res.status(200).json(academia);
  } catch (err) {
    console.error("Erro ao buscar dados da academia:", err);
    res.status(500).json({ error: "Erro ao buscar dados da academia" });
  }
});

export default router;