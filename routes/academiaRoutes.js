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

// Middleware para verificar se o usuário é academia
const isAcademia = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ACADEMIA') {
      return res.status(403).json({ error: "Acesso negado. Apenas academias podem acessar esta funcionalidade" });
    }

    next();
  } catch (err) {
    console.error("Erro ao verificar perfil de usuário:", err);
    return res.status(500).json({ error: "Erro ao verificar perfil de usuário" });
  }
};

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Buscar dados da academia logada (requer ser academia)
router.get("/academia/perfil", [isAcademia], async (req, res) => {
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    res.status(200).json(user.academia);
  } catch (err) {
    console.error("Erro ao buscar dados da academia:", err);
    res.status(500).json({ error: "Erro ao buscar dados da academia" });
  }
});

// Salvar/atualizar dados da academia (requer ser academia)
router.post("/academia/perfil", [isAcademia], async (req, res) => {
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

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

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

// Buscar dados de uma academia específica
router.get("/academia/detalhes/:academiaId", async (req, res) => {
  try {
    const { academiaId } = req.params;

    // Buscar academia
    const academia = await prisma.academia.findUnique({
      where: { 
        id: parseInt(academiaId) 
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