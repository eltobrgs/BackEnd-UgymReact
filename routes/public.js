import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Cadastro de aluno
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
        role: 'ALUNO',
        preferenciasAluno: {
          create: {
            birthDate: new Date(),
            gender: "",
            goal: "Não informado",
            healthCondition: "",
            experience: "Iniciante",
            height: "Não informado",
            weight: "Não informado",
            activityLevel: "",
            medicalConditions: "",
            physicalLimitations: ""
          }
        }
      },
      include: {
        preferenciasAluno: true
      }
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
    res.status(500).json({ error: "Erro ao realizar cadastro" });
  }
});

// Cadastro de personal trainer
router.post("/cadastro-personal", async (req, res) => {
  try {
    const { name, email, password, cref, specialization } = req.body;

    // Verificar se o CREF já existe
    const existingCref = await prisma.preferenciasPersonal.findUnique({
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
        preferenciasPersonal: {
          create: {
            cref,
            specialization,
            birthDate: new Date(),
            gender: "",
            specializations: [],
            yearsOfExperience: "",
            workSchedule: "",
            certifications: [],
            biography: "",
            workLocation: "",
            pricePerHour: "",
            languages: []
          }
        }
      },
      include: {
        preferenciasPersonal: true
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
      },
    });
  } catch (err) {
    console.error("Erro ao realizar cadastro de personal:", err);
    res.status(500).json({ error: "Erro ao realizar cadastro de personal" });
  }
});

// Cadastro de academia
router.post("/cadastro-academia", async (req, res) => {
  try {
    const { name, email, password, cnpj } = req.body;

    // Verificar se o CNPJ já existe
    const existingCnpj = await prisma.academia.findUnique({
      where: { cnpj },
    });

    if (existingCnpj) {
      return res.status(400).json({ error: "CNPJ já cadastrado" });
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Criar usuário com role ACADEMIA e seus dados iniciais
    const savedUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: 'ACADEMIA',
        academia: {
          create: {
            cnpj,
            endereco: "",
            telefone: "",
            horarioFuncionamento: "",
            descricao: "",
            comodidades: [],
            planos: []
          }
        }
      },
      include: {
        academia: true
      }
    });

    // Gerar o token JWT
    const token = jwt.sign({ userId: savedUser.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: "Cadastro de academia realizado com sucesso",
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      },
    });
  } catch (err) {
    console.error("Erro ao realizar cadastro de academia:", err);
    res.status(500).json({ error: "Erro ao realizar cadastro de academia" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    // Gerar token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: "Login realizado com sucesso",
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

// Listar todos os personais (acesso público)
router.get("/personals", async (req, res) => {
  try {
    const personals = await prisma.preferenciasPersonal.findMany({
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

    // Formatar a resposta para manter a mesma estrutura
    const formattedPersonals = personals.map(personal => ({
      id: personal.userId,
      name: personal.user.name,
      email: personal.user.email,
      cref: personal.cref,
      specialization: personal.specialization,
      // Incluir outros campos necessários
    }));

    res.status(200).json(formattedPersonals);
  } catch (err) {
    console.error("Erro ao buscar lista de personais:", err);
    res.status(500).json({ error: "Erro ao buscar lista de personais" });
  }
});

// Buscar dados de um personal específico (acesso público)
router.get("/personal/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar personal e seus dados básicos de usuário
    const personal = await prisma.preferenciasPersonal.findFirst({
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

export default router;