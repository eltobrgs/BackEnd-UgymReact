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

// Salvar/atualizar preferências do usuário comum
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
    const existingPreferences = await prisma.preferences.findUnique({
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
    };

    let preferences;
    
    if (existingPreferences) {
      // Atualizar preferências existentes
      preferences = await prisma.preferences.update({
        where: { userId: user.id },
        data: preferencesData,
      });
    } else {
      // Criar novas preferências
      preferences = await prisma.preferences.create({
        data: {
          ...preferencesData,
          userId: user.id,
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

// Buscar preferências do usuário comum
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
    const preferences = await prisma.preferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      return res.status(404).json({ error: "Preferências não encontradas" });
    }

    // Formatar data de nascimento
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

    // Buscar usuário e verificar se é personal
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { personal: true }
    });

    if (!user || user.role !== 'PERSONAL') {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    // Converter a data
    const [day, month, year] = birthDate.split('/');
    const parsedBirthDate = new Date(`${year}-${month}-${day}`);

    // Atualizar dados do personal
    const updatedPersonal = await prisma.personal.update({
      where: { userId: user.id },
      data: {
        birthDate: parsedBirthDate,
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
      }
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
    const personal = await prisma.personal.findUnique({
      where: { userId: req.userId },
    });

    if (!personal) {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    // Buscar alunos vinculados ao personal
    const students = await prisma.user.findMany({
      where: {
        role: 'USUARIO_COMUM',
        preferences: {
          personalId: personal.id
        }
      },
      include: {
        preferences: {
          select: {
            birthDate: true,
            weight: true,
            height: true,
            goal: true,
            experience: true
          }
        }
      }
    });

    // Formatar os dados dos alunos
    const formattedStudents = students.map(student => {
      const age = student.preferences?.birthDate 
        ? Math.floor((new Date() - new Date(student.preferences.birthDate)) / (1000 * 60 * 60 * 24 * 365.25))
        : null;

      return {
        id: student.id,
        name: student.name,
        age: age,
        weight: student.preferences?.weight || 'Não informado',
        height: student.preferences?.height || 'Não informado',
        goal: student.preferences?.goal || 'Não informado',
        trainingTime: student.preferences?.experience || 'Iniciante'
      };
    });

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Erro ao buscar lista de alunos:", err);
    res.status(500).json({ error: "Erro ao buscar lista de alunos" });
  }
});

// Adicionar aluno ao personal
router.post("/add-student", async (req, res) => {
    try {
      const { studentCode } = req.body;
  
      // Buscar personal
      const personal = await prisma.personal.findUnique({
        where: { userId: req.userId },
      });
  
      if (!personal) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
  
      // Verificar se o código do aluno é válido
      if (!studentCode || isNaN(studentCode)) {
        return res.status(400).json({ error: "Código de aluno inválido" });
      }
  
      // Buscar aluno pelo código
      const student = await prisma.user.findFirst({
        where: {
          id: parseInt(studentCode),
          role: 'USUARIO_COMUM'
        }
      });
  
      // Verificar se o aluno existe
      if (!student) {
        return res.status(404).json({ error: "Aluno não existe" });
      }
  
      // Verificar se o aluno já está vinculado a este personal
      const existingPreferences = await prisma.preferences.findUnique({
        where: { userId: student.id }
      });
  
      if (existingPreferences?.personalId === personal.id) {
        return res.status(400).json({ error: "Você já adicionou esse aluno" });
      }
  
      // Vincular aluno ao personal
      if (existingPreferences) {
        await prisma.preferences.update({
          where: { userId: student.id },
          data: { personalId: personal.id }
        });
      } else {
        await prisma.preferences.create({
          data: {
            userId: student.id,
            personalId: personal.id,
            birthDate: new Date(),
            gender: '',
            goal: '',
            healthCondition: '',
            experience: '',
            height: '',
            weight: '',
            activityLevel: '',
            medicalConditions: '',
            physicalLimitations: ''
          }
        });
      }
  
      res.status(200).json({
        message: "Aluno adicionado com sucesso",
        student: {
          id: student.id,
          name: student.name
        }
      });
    } catch (err) {
      console.error("Erro ao adicionar aluno:", err);
      res.status(500).json({ error: "Erro ao adicionar aluno" });
    }
  });

// Listar todos os alunos (apenas para personais ou administradores)
router.get("/all-students", async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'USUARIO_COMUM'
      },
      include: {
        preferences: true
      }
    });

    const formattedStudents = students.map(student => {
      const age = student.preferences?.birthDate 
        ? Math.floor((new Date() - new Date(student.preferences.birthDate)) / (1000 * 60 * 60 * 24 * 365.25))
        : 0;

      return {
        id: student.id,
        name: student.name,
        age: age,
        weight: student.preferences?.weight || 'Não informado',
        height: student.preferences?.height || 'Não informado',
        goal: student.preferences?.goal || 'Não informado',
        trainingTime: student.preferences?.experience || 'Iniciante'
      };
    });

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Erro ao buscar todos os alunos:", err);
    res.status(500).json({ error: "Erro ao buscar todos os alunos" });
  }
});

export default router;