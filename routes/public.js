//publi.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Rotas de Autenticação
 */

// Cadastro de usuário comum
router.post("/cadastro", async (req, res) => {
  try {
    const user = req.body;
    console.log("Dados do usuário recebidos:", user);

    // Validações básicas
    if (!user.name || !user.email || !user.password) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    // Validar tamanho mínimo da senha
    if (user.password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres" });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: "Este email já está cadastrado" });
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);

    // Salvar usuário no banco de dados
    const savedUser = await prisma.user.create({
      data: {
        name: user.name.trim(),
        email: user.email.toLowerCase().trim(),
        password: hash,
        role: 'USUARIO_COMUM'
      },
    });

    // Gerar o token JWT
    const token = jwt.sign({ userId: savedUser.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: "Cadastro realizado com sucesso",
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      },
    });
  } catch (err) {
    console.error("Erro ao realizar cadastro:", err);
    
    // Tratamento específico para erros do Prisma
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(400).json({ error: "Este email já está cadastrado" });
    }
    
    res.status(500).json({ error: "Erro ao realizar cadastro" });
  }
});

// Cadastro de personal trainer
router.post("/cadastro-personal", async (req, res) => {
  try {
    const { name, email, password, cref, specialization } = req.body;

    // Verificar se o CREF já existe
    const existingCref = await prisma.personal.findUnique({
      where: { cref },
    });

    if (existingCref) {
      return res.status(400).json({ error: "CREF já cadastrado" });
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Criar usuário com role PERSONAL e seus dados iniciais
    const savedUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: 'PERSONAL',
        personal: {
          create: {
            cref,
            specialization,
            birthDate: new Date(),
            gender: '',
            specializations: [],
            yearsOfExperience: '',
            workSchedule: '',
            certifications: [],
            biography: '',
            workLocation: '',
            pricePerHour: '',
            languages: [],
          }
        }
      },
      include: {
        personal: true
      }
    });

    // Gerar o token JWT
    const token = jwt.sign({ userId: savedUser.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: "Cadastro de personal realizado com sucesso",
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (err) {
    console.error("Erro ao realizar cadastro de personal:", err);
    res.status(500).json({ error: "Erro ao realizar cadastro de personal" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Gerar o token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "Login bem-sucedido",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
    });
  } catch (err) {
    console.error("Erro ao realizar login:", err);
    res.status(500).json({ error: "Erro ao realizar login" });
  }
});

/**
 * Rotas de Usuário Comum
 */

// Buscar dados do usuário
router.get("/me", async (req, res) => {
  try {
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

// Salvar preferências do usuário comum
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

    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

/**
 * Rotas de Personal Trainer
 */

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

    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar usuário e verificar se é personal
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

// Buscar dados do perfil do personal
router.get("/personal/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar personal e seus dados básicos de usuário
    const personal = await prisma.personal.findFirst({
      where: { userId: parseInt(id) },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!personal) {
      return res.status(404).json({ error: "Personal não encontrado" });
    }

    res.status(200).json(personal);
  } catch (err) {
    console.error("Erro ao buscar dados do personal:", err);
    res.status(500).json({ error: "Erro ao buscar dados do personal" });
  }
});

// Endpoint para listar todos os personais
router.get("/personals", async (req, res) => {
  try {
    const personals = await prisma.personal.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(200).json(personals);
  } catch (err) {
    console.error("Erro ao buscar lista de personais:", err);
    res.status(500).json({ error: "Erro ao buscar lista de personais" });
  }
});

// Endpoint para listar todos os alunos de um personal
router.get("/my-students", async (req, res) => {
  try {
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar personal
    const personal = await prisma.personal.findUnique({
      where: { userId: decoded.userId },
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

// Endpoint para adicionar aluno ao personal
router.post("/add-student", async (req, res) => {
  try {
    // Verificar token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Buscar personal
    const personal = await prisma.personal.findUnique({
      where: { userId: decoded.userId },
    });

    if (!personal) {
      return res.status(403).json({ error: "Acesso não autorizado" });
    }

    const { studentCode } = req.body;

    // Buscar aluno pelo código
    const student = await prisma.user.findFirst({
      where: {
        id: parseInt(studentCode),
        role: 'USUARIO_COMUM'
      }
    });

    if (!student) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }

    // Verificar se o aluno já está vinculado a este personal
    const existingPreferences = await prisma.preferences.findUnique({
      where: { userId: student.id }
    });

    if (existingPreferences?.personalId === personal.id) {
      return res.status(400).json({ error: "Aluno já está vinculado a este personal" });
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