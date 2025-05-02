import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Login
router.post("/entrar", async (req, res) => {
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
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

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

// Cadastro de aluno
router.post("/aluno/cadastrar", async (req, res) => {
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

    // Verificar e validar o ID da academia
    let academiaId = null;
    if (user.academiaId) {
      academiaId = parseInt(user.academiaId);
      
      // Verificar se a academia existe
      const academia = await prisma.academia.findUnique({
        where: { id: academiaId }
      });
      
      if (!academia) {
        return res.status(400).json({ error: "Academia não encontrada" });
      }
      
      console.log("Academia encontrada e validada:", academia.id);
    } else {
      console.log("Aluno cadastrado sem academia associada");
    }

    // Salvar usuário no banco de dados com associação à academia
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
            physicalLimitations: "",
            academiaId: academiaId
          }
        }
      },
      include: {
        preferenciasAluno: true
      }
    });

    console.log("Aluno salvo com preferências:", savedUser.preferenciasAluno);

    // Gerar o token JWT
    const token = jwt.sign({ id: savedUser.id }, JWT_SECRET, { expiresIn: '1h' });

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
router.post("/personal/cadastrar", async (req, res) => {
  try {
    const { name, email, password, cref, specialization, academiaId } = req.body;

    // Verificar se o CREF já existe
    const existingCref = await prisma.preferenciasPersonal.findUnique({
      where: { cref },
    });

    if (existingCref) {
      return res.status(400).json({ error: "CREF já cadastrado" });
    }

    // Verificar se academia existe quando academiaId é fornecido
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
            languages: [],
            academiaId: academiaIdParsed
          }
        }
      },
      include: {
        preferenciasPersonal: true
      }
    });

    // Gerar o token JWT
    const token = jwt.sign({ id: savedUser.id }, JWT_SECRET, { expiresIn: '1h' });

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
router.post("/academia/cadastrar", async (req, res) => {
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
    const token = jwt.sign({ id: savedUser.id }, JWT_SECRET, { expiresIn: '1h' });

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

export default router; 