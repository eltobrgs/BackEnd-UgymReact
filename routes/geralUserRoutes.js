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

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Buscar dados do usuário logado
router.get("/perfil", async (req, res) => {
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

// Listar todos os personais
router.get("/personais/listar", async (req, res) => {
  try {
    // Verificar se foi solicitado filtragem por academia
    const { academiaId } = req.query;
    
    // Preparar o filtro baseado na academia (se fornecido)
    const whereClause = academiaId
      ? { academiaId: parseInt(academiaId) }
      : {};
    
    const personals = await prisma.preferenciasPersonal.findMany({
      where: whereClause,
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
      specializations: personal.specializations || [],
      yearsOfExperience: personal.yearsOfExperience || "N/A",
      workLocation: personal.workLocation || "N/A",
      pricePerHour: personal.pricePerHour || "N/A",
      biography: personal.biography || "",
      instagram: personal.instagram || "",
      linkedin: personal.linkedin || ""
    }));

    res.status(200).json(formattedPersonals);
  } catch (err) {
    console.error("Erro ao buscar lista de personais:", err);
    res.status(500).json({ error: "Erro ao buscar lista de personais" });
  }
});

// Listar todas as academias
router.get("/academias/listar", async (req, res) => {
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

// Listar todos os alunos (filtrado por academia para personal/academia)
router.get("/alunos/listar", async (req, res) => {
  try {
    // Buscar o usuário logado
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        preferenciasPersonal: true,
        academia: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    console.log("Usuário logado:", {
      id: user.id,
      email: user.email,
      role: user.role,
      academiaId: user.academia?.id || null
    });

    let academiaId = null;

    // Verificar o tipo de usuário para definir o filtro por academia
    if (user.role === 'ACADEMIA') {
      // Se for academia, busca os alunos desta academia
      academiaId = user.academia?.id;
      console.log("Academia ID encontrado:", academiaId);
    } else if (user.role === 'PERSONAL') {
      // Se for personal, busca os alunos da academia à qual ele pertence
      academiaId = user.preferenciasPersonal?.academiaId;
      console.log("Academia ID do personal:", academiaId);
    }

    if (!academiaId && (user.role === 'ACADEMIA' || user.role === 'PERSONAL')) {
      console.log("AVISO: Usuário sem academia associada");
    }

    // Montar o filtro de busca baseado na academia (se aplicável)
    const whereClause = academiaId 
      ? { academiaId } 
      : {};
    
    console.log("Filtro aplicado:", whereClause);

    // Buscar todos os alunos com filtro
    const students = await prisma.user.findMany({
      where: {
        role: 'ALUNO',
        preferenciasAluno: {
          ...(academiaId ? { academiaId } : {})
        }
      },
      include: {
        preferenciasAluno: true
      }
    });

    console.log(`Total de alunos encontrados: ${students.length}`);

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
        trainingTime: student.preferenciasAluno?.experience || 'Iniciante',
        academiaId: student.preferenciasAluno?.academiaId
      };
    });

    res.status(200).json(formattedStudents);
  } catch (err) {
    console.error("Erro ao buscar alunos:", err);
    res.status(500).json({ error: "Erro ao buscar alunos" });
  }
});

// DEBUG: Listar academias e seus alunos para depuração
router.get("/debug/academias-alunos", async (req, res) => {
  try {
    // Buscar todas as academias com seus alunos
    const academias = await prisma.academia.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        alunos: {
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

    // Buscar todos os alunos que possuem academiaId
    const alunosComAcademia = await prisma.preferenciasAluno.findMany({
      where: {
        academiaId: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        academia: {
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

    // Buscar todos os alunos sem academia
    const alunosSemAcademia = await prisma.preferenciasAluno.findMany({
      where: {
        academiaId: null
      },
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

    res.status(200).json({
      academias,
      alunosComAcademia,
      alunosSemAcademia,
      totalAcademias: academias.length,
      totalAlunosComAcademia: alunosComAcademia.length,
      totalAlunosSemAcademia: alunosSemAcademia.length
    });
  } catch (err) {
    console.error("Erro ao buscar debug:", err);
    res.status(500).json({ error: "Erro ao buscar dados de debug" });
  }
});

// Associar um aluno a uma academia
router.post("/associar-aluno-academia", async (req, res) => {
  try {
    const { alunoId, academiaId } = req.body;
    
    if (!alunoId || !academiaId) {
      return res.status(400).json({ error: "IDs de aluno e academia são obrigatórios" });
    }
    
    // Verificar se o usuário logado é uma academia
    const usuario = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true, academia: true }
    });
    
    if (!usuario || usuario.role !== 'ACADEMIA') {
      return res.status(403).json({ error: "Apenas academias podem associar alunos" });
    }
    
    // Verificar se a academia do usuário corresponde à solicitada
    if (usuario.academia?.id !== parseInt(academiaId)) {
      return res.status(403).json({ error: "Você só pode associar alunos à sua própria academia" });
    }
    
    // Verificar se o aluno existe
    const aluno = await prisma.user.findFirst({
      where: { 
        id: parseInt(alunoId),
        role: 'ALUNO'
      },
      include: {
        preferenciasAluno: true
      }
    });
    
    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado" });
    }
    
    // Atualizar as preferências do aluno com o academiaId
    const preferenciaAtualizada = await prisma.preferenciasAluno.update({
      where: { userId: aluno.id },
      data: { academiaId: parseInt(academiaId) }
    });
    
    res.status(200).json({
      message: "Aluno associado à academia com sucesso",
      aluno: {
        id: aluno.id,
        name: aluno.name,
        email: aluno.email
      },
      academiaId: parseInt(academiaId)
    });
  } catch (err) {
    console.error("Erro ao associar aluno à academia:", err);
    res.status(500).json({ error: "Erro ao associar aluno à academia" });
  }
});

// Buscar aluno por email
router.get("/buscar-aluno-email", async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório" });
    }
    
    // Verificar se o usuário logado tem permissão (academia ou personal)
    const usuario = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });
    
    if (!usuario || (usuario.role !== 'ACADEMIA' && usuario.role !== 'PERSONAL')) {
      return res.status(403).json({ error: "Apenas academias ou personais podem buscar alunos por email" });
    }
    
    // Buscar aluno por email
    const aluno = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: 'ALUNO'
      },
      select: {
        id: true,
        name: true,
        email: true,
        preferenciasAluno: {
          select: {
            academiaId: true
          }
        }
      }
    });
    
    if (!aluno) {
      return res.status(404).json({ error: "Aluno não encontrado com este email" });
    }
    
    // Se o aluno já estiver associado a uma academia
    if (aluno.preferenciasAluno?.academiaId) {
      return res.status(400).json({ error: "Este aluno já está associado a uma academia" });
    }
    
    res.status(200).json({
      id: aluno.id,
      name: aluno.name,
      email: aluno.email
    });
  } catch (err) {
    console.error("Erro ao buscar aluno por email:", err);
    res.status(500).json({ error: "Erro ao buscar aluno por email" });
  }
});

export default router; 