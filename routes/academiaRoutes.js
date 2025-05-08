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

// Rota para editar perfil da academia (campos específicos)
router.put("/academia/editar-perfil", [isAcademia], async (req, res) => {
  try {
    const { 
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

    // Buscar academia do usuário
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    // Dados a serem atualizados
    const updateData = {
      ...(endereco !== undefined && { endereco }),
      ...(telefone !== undefined && { telefone }),
      ...(horarioFuncionamento !== undefined && { horarioFuncionamento }),
      ...(descricao !== undefined && { descricao }),
      ...(comodidades !== undefined && { comodidades }),
      ...(planos !== undefined && { planos }),
      ...(website !== undefined && { website }),
      ...(instagram !== undefined && { instagram }),
      ...(facebook !== undefined && { facebook })
    };

    // Atualizar academia
    const updatedAcademia = await prisma.academia.update({
      where: { id: user.academia.id },
      data: updateData
    });

    res.status(200).json({
      message: "Perfil atualizado com sucesso",
      academia: updatedAcademia
    });
  } catch (err) {
    console.error("Erro ao atualizar perfil de academia:", err);
    res.status(500).json({ error: "Erro ao atualizar perfil de academia" });
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

// ROTAS PARA GESTÃO DE EVENTOS

// Listar todos os eventos da academia
router.get("/eventos", [isAcademia], async (req, res) => {
  try {
    // Buscar academia do usuário logado
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    // Buscar eventos da academia
    const eventos = await prisma.evento.findMany({
      where: { academiaId: user.academia.id },
      orderBy: { dataInicio: 'asc' }
    });

    console.log(`Encontrados ${eventos.length} eventos para a academia ${user.academia.id}`);
    
    res.status(200).json(eventos);
  } catch (err) {
    console.error("Erro ao buscar eventos da academia:", err);
    res.status(500).json({ error: "Erro ao buscar eventos da academia" });
  }
});

// Criar um novo evento
router.post("/eventos", [isAcademia], async (req, res) => {
  try {
    const { titulo, descricao, dataInicio, dataFim, local, tipo } = req.body;

    // Validar dados obrigatórios
    if (!titulo || !descricao || !dataInicio || !dataFim || !local || !tipo) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios" });
    }

    // Validar tipo do evento
    const tiposValidos = ["ALUNO", "PERSONAL", "TODOS"];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: "Tipo de evento inválido. Deve ser ALUNO, PERSONAL ou TODOS" });
    }

    // Buscar academia do usuário logado
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    // Converter datas
    let dataInicioObj, dataFimObj;
    try {
      // Verificar se as datas estão no formato ISO ou DD/MM/YYYY
      if (dataInicio.includes('/')) {
        const [dia, mes, ano] = dataInicio.split('/');
        dataInicioObj = new Date(`${ano}-${mes}-${dia}`);
      } else {
        dataInicioObj = new Date(dataInicio);
      }

      if (dataFim.includes('/')) {
        const [dia, mes, ano] = dataFim.split('/');
        dataFimObj = new Date(`${ano}-${mes}-${dia}`);
      } else {
        dataFimObj = new Date(dataFim);
      }

      if (isNaN(dataInicioObj) || isNaN(dataFimObj)) {
        throw new Error("Data inválida");
      }
    } catch (error) {
      return res.status(400).json({ error: "Formato de data inválido. Use ISO ou DD/MM/YYYY" });
    }

    // Criar evento
    const novoEvento = await prisma.evento.create({
      data: {
        titulo,
        descricao,
        dataInicio: dataInicioObj,
        dataFim: dataFimObj,
        local,
        tipo,
        academiaId: user.academia.id
      }
    });

    console.log(`Evento ${novoEvento.id} criado para a academia ${user.academia.id}`);

    res.status(201).json({
      message: "Evento criado com sucesso",
      evento: novoEvento
    });
  } catch (err) {
    console.error("Erro ao criar evento:", err);
    res.status(500).json({ error: "Erro ao criar evento" });
  }
});

// Obter evento específico
router.get("/eventos/:eventoId", [isAcademia], async (req, res) => {
  try {
    const { eventoId } = req.params;

    // Buscar academia do usuário logado
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    // Buscar evento
    const evento = await prisma.evento.findUnique({
      where: { id: parseInt(eventoId) }
    });

    if (!evento) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Verificar se o evento pertence à academia
    if (evento.academiaId !== user.academia.id) {
      return res.status(403).json({ error: "Acesso negado. Este evento não pertence à sua academia" });
    }

    res.status(200).json(evento);
  } catch (err) {
    console.error("Erro ao buscar evento:", err);
    res.status(500).json({ error: "Erro ao buscar evento" });
  }
});

// Atualizar evento
router.put("/eventos/:eventoId", [isAcademia], async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { titulo, descricao, dataInicio, dataFim, local, tipo } = req.body;

    // Buscar academia do usuário logado
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    // Buscar evento
    const evento = await prisma.evento.findUnique({
      where: { id: parseInt(eventoId) }
    });

    if (!evento) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Verificar se o evento pertence à academia
    if (evento.academiaId !== user.academia.id) {
      return res.status(403).json({ error: "Acesso negado. Este evento não pertence à sua academia" });
    }

    // Validar tipo do evento se fornecido
    if (tipo) {
      const tiposValidos = ["ALUNO", "PERSONAL", "TODOS"];
      if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ error: "Tipo de evento inválido. Deve ser ALUNO, PERSONAL ou TODOS" });
      }
    }

    // Converter datas se fornecidas
    let dataInicioObj, dataFimObj;
    if (dataInicio) {
      try {
        if (dataInicio.includes('/')) {
          const [dia, mes, ano] = dataInicio.split('/');
          dataInicioObj = new Date(`${ano}-${mes}-${dia}`);
        } else {
          dataInicioObj = new Date(dataInicio);
        }

        if (isNaN(dataInicioObj)) {
          throw new Error("Data inválida");
        }
      } catch (error) {
        return res.status(400).json({ error: "Formato de data inválido para dataInicio. Use ISO ou DD/MM/YYYY" });
      }
    }

    if (dataFim) {
      try {
        if (dataFim.includes('/')) {
          const [dia, mes, ano] = dataFim.split('/');
          dataFimObj = new Date(`${ano}-${mes}-${dia}`);
        } else {
          dataFimObj = new Date(dataFim);
        }

        if (isNaN(dataFimObj)) {
          throw new Error("Data inválida");
        }
      } catch (error) {
        return res.status(400).json({ error: "Formato de data inválido para dataFim. Use ISO ou DD/MM/YYYY" });
      }
    }

    // Dados para atualização
    const dadosAtualizacao = {
      ...(titulo && { titulo }),
      ...(descricao && { descricao }),
      ...(dataInicioObj && { dataInicio: dataInicioObj }),
      ...(dataFimObj && { dataFim: dataFimObj }),
      ...(local && { local }),
      ...(tipo && { tipo })
    };

    // Atualizar evento
    const eventoAtualizado = await prisma.evento.update({
      where: { id: parseInt(eventoId) },
      data: dadosAtualizacao
    });

    console.log(`Evento ${eventoId} atualizado`);

    res.status(200).json({
      message: "Evento atualizado com sucesso",
      evento: eventoAtualizado
    });
  } catch (err) {
    console.error("Erro ao atualizar evento:", err);
    res.status(500).json({ error: "Erro ao atualizar evento" });
  }
});

// Excluir evento
router.delete("/eventos/:eventoId", [isAcademia], async (req, res) => {
  try {
    const { eventoId } = req.params;

    // Buscar academia do usuário logado
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }

    // Buscar evento
    const evento = await prisma.evento.findUnique({
      where: { id: parseInt(eventoId) }
    });

    if (!evento) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Verificar se o evento pertence à academia
    if (evento.academiaId !== user.academia.id) {
      return res.status(403).json({ error: "Acesso negado. Este evento não pertence à sua academia" });
    }

    // Excluir evento
    await prisma.evento.delete({
      where: { id: parseInt(eventoId) }
    });

    console.log(`Evento ${eventoId} excluído`);

    res.status(200).json({
      message: "Evento excluído com sucesso"
    });
  } catch (err) {
    console.error("Erro ao excluir evento:", err);
    res.status(500).json({ error: "Erro ao excluir evento" });
  }
});

// Rota para listar presenças confirmadas em um evento
router.get('/eventos/:eventoId/presencas', [isAcademia], async (req, res) => {
  try {
    const { eventoId } = req.params;
    
    // Buscar academia do usuário logado
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { academia: true }
    });

    if (!user.academia) {
      return res.status(404).json({ error: 'Perfil de academia não encontrado' });
    }
    
    // Verificar se o evento pertence à academia
    const evento = await prisma.evento.findFirst({
      where: {
        id: parseInt(eventoId),
        academiaId: user.academia.id
      }
    });

    if (!evento) {
      return res.status(404).json({ error: 'Evento não encontrado ou não pertence a esta academia' });
    }

    // Buscar presenças confirmadas
    const presencas = await prisma.eventoPresenca.findMany({
      where: {
        eventoId: parseInt(eventoId)
      }
    });

    // Buscar dados de usuário para cada presença
    const presencasComUsuarios = await Promise.all(
      presencas.map(async (presenca) => {
        const usuario = await prisma.user.findUnique({
          where: { id: presenca.userId },
          include: {
            preferenciasAluno: true,
            preferenciasPersonal: true
          }
        });

        return {
          ...presenca,
          usuario: {
            id: usuario.id,
            name: usuario.name,
            email: usuario.email,
            role: usuario.role,
            perfil: usuario.role === 'ALUNO' ? usuario.preferenciasAluno : usuario.preferenciasPersonal
          }
        };
      })
    );

    return res.json(presencasComUsuarios);
  } catch (error) {
    console.error('Erro ao buscar presenças:', error);
    return res.status(500).json({ error: 'Erro ao buscar presenças confirmadas' });
  }
});

// Obter estatísticas do dashboard da academia
router.get("/academia/dashboard-stats", [isAcademia], async (req, res) => {
  try {
    // Buscar academia
    const academia = await prisma.academia.findUnique({
      where: { userId: req.userId }
    });
    
    if (!academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }
    
    // Buscar total de alunos vinculados à academia
    const totalStudents = await prisma.preferenciasAluno.count({
      where: { academiaId: academia.id }
    });
    
    // Buscar total de personais vinculados à academia
    const totalPersonals = await prisma.preferenciasPersonal.count({
      where: { academiaId: academia.id }
    });
    
    // Buscar total de equipamentos cadastrados
    const totalEquipment = await prisma.equipamento.count({
      where: { academiaId: academia.id }
    });
    
    // Buscar eventos futuros
    const hoje = new Date();
    const upcomingEvents = await prisma.evento.count({
      where: {
        academiaId: academia.id,
        dataFim: {
          gte: hoje
        }
      }
    });
    
    // Calcular receita mensal estimada (mensalidade média × número de alunos)
    const mensalidadeMedia = 150; // Valor fixo para exemplo
    const monthlyRevenue = totalStudents * mensalidadeMedia;
    
    res.status(200).json({
      totalStudents,
      totalPersonals,
      totalEquipment,
      upcomingEvents,
      monthlyRevenue
    });
  } catch (err) {
    console.error("Erro ao buscar estatísticas do dashboard:", err);
    res.status(500).json({ error: "Erro ao buscar estatísticas do dashboard" });
  }
});

// Obter ações recentes da academia
router.get("/academia/acoes-recentes", [isAcademia], async (req, res) => {
  try {
    // Buscar academia
    const academia = await prisma.academia.findUnique({
      where: { userId: req.userId }
    });
    
    if (!academia) {
      return res.status(404).json({ error: "Perfil de academia não encontrado" });
    }
    
    // Placeholder para buscar ações recentes de uma tabela de logs
    // Como essa tabela pode não existir no modelo atual, geramos dados de exemplo
    
    // Array de exemplos de ações recentes
    const acoes = [
      {
        id: 1,
        tipo: 'CADASTRO_ALUNO',
        descricao: 'Novo aluno registrado',
        data: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        usuarioId: req.userId,
        usuarioNome: 'Admin da Academia'
      },
      {
        id: 2,
        tipo: 'CADASTRO_PERSONAL',
        descricao: 'Novo personal cadastrado',
        data: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
        usuarioId: req.userId,
        usuarioNome: 'Admin da Academia'
      },
      {
        id: 3,
        tipo: 'CADASTRO_EVENTO',
        descricao: 'Evento de fim de ano criado',
        data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
        usuarioId: req.userId,
        usuarioNome: 'Admin da Academia'
      },
      {
        id: 4,
        tipo: 'EDICAO_ALUNO',
        descricao: 'Informações de aluno atualizadas',
        data: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 dias atrás
        usuarioId: req.userId,
        usuarioNome: 'Admin da Academia'
      },
      {
        id: 5,
        tipo: 'CADASTRO_EQUIPAMENTO',
        descricao: 'Novos equipamentos cadastrados',
        data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
        usuarioId: req.userId,
        usuarioNome: 'Admin da Academia'
      },
      {
        id: 6,
        tipo: 'CONCLUSAO_TAREFA',
        descricao: 'Tarefa concluída com sucesso',
        data: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 dias atrás
        usuarioId: req.userId,
        usuarioNome: 'Admin da Academia'
      },
      {
        id: 7,
        tipo: 'CADASTRO_TAREFA',
        descricao: 'Nova tarefa adicionada',
        data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
        usuarioId: req.userId,
        usuarioNome: 'Admin da Academia'
      }
    ];
    
    res.status(200).json(acoes);
  } catch (err) {
    console.error("Erro ao buscar ações recentes:", err);
    res.status(500).json({ error: "Erro ao buscar ações recentes" });
  }
});

// Adicionando as rotas de pagamentos para academia

// Listar todos os alunos com status de pagamento
router.get('/alunos/pagamentos', [isAcademia], async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academia: true }
    });

    if (!user || user.role !== 'ACADEMIA' || !user.academia) {
      return res.status(403).json({ error: 'Acesso não autorizado. Usuário não é uma academia.' });
    }

    const academiaId = user.academia.id;

    // Buscar alunos da academia com informações de pagamento mais recente
    const alunos = await prisma.preferenciasAluno.findMany({
      where: {
        academiaId: academiaId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pagamentos: {
          orderBy: {
            dataVencimento: 'desc'
          },
          take: 1
        }
      }
    });

    // Formatar resposta
    const alunosComPagamento = alunos.map(aluno => {
      const pagamentoRecente = aluno.pagamentos[0];
      
      return {
        id: aluno.id,
        userId: aluno.userId,
        nome: aluno.user.name,
        email: aluno.user.email,
        goal: aluno.goal,
        statusPagamento: pagamentoRecente ? pagamentoRecente.status : 'PENDENTE',
        ultimoPagamento: pagamentoRecente ? pagamentoRecente.dataPagamento : null,
        dataVencimento: pagamentoRecente ? pagamentoRecente.dataVencimento : null,
        plano: pagamentoRecente ? pagamentoRecente.tipoPlano : 'MENSAL',
        valor: pagamentoRecente ? pagamentoRecente.valor : 0
      };
    });

    return res.status(200).json(alunosComPagamento);
  } catch (error) {
    console.error('Erro ao buscar alunos com pagamentos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter histórico de pagamentos de um aluno específico
router.get('/alunos/:id/pagamentos', [isAcademia], async (req, res) => {
  try {
    const userId = req.userId;
    const alunoId = parseInt(req.params.id);

    if (isNaN(alunoId)) {
      return res.status(400).json({ error: 'ID do aluno inválido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academia: true }
    });

    if (!user || user.role !== 'ACADEMIA' || !user.academia) {
      return res.status(403).json({ error: 'Acesso não autorizado. Usuário não é uma academia.' });
    }

    const academiaId = user.academia.id;

    // Verificar se o aluno pertence à academia
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: {
        id: alunoId,
        academiaId: academiaId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado ou não pertence à sua academia' });
    }

    // Buscar pagamentos do aluno
    const pagamentos = await prisma.pagamento.findMany({
      where: {
        alunoId: alunoId,
        academiaId: academiaId
      },
      orderBy: {
        dataVencimento: 'desc'
      }
    });

    return res.status(200).json(pagamentos);
  } catch (error) {
    console.error('Erro ao buscar pagamentos do aluno:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registrar novo pagamento
router.post('/pagamentos', [isAcademia], async (req, res) => {
  try {
    const userId = req.userId;
    const { alunoId, valor, dataPagamento, dataVencimento, status, formaPagamento, tipoPlano, observacoes } = req.body;

    if (!alunoId || !valor || !dataPagamento || !dataVencimento || !formaPagamento || !tipoPlano) {
      return res.status(400).json({ error: 'Dados incompletos para registrar o pagamento' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academia: true }
    });

    if (!user || user.role !== 'ACADEMIA' || !user.academia) {
      return res.status(403).json({ error: 'Acesso não autorizado. Usuário não é uma academia.' });
    }

    const academiaId = user.academia.id;

    // Verificar se o aluno pertence à academia
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: {
        id: parseInt(alunoId),
        academiaId: academiaId
      }
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado ou não pertence à sua academia' });
    }

    // Criar o pagamento
    const novoPagamento = await prisma.pagamento.create({
      data: {
        valor: parseFloat(valor),
        dataPagamento: new Date(dataPagamento),
        dataVencimento: new Date(dataVencimento),
        status: status || 'PAGO',
        formaPagamento,
        tipoPlano,
        observacoes,
        alunoId: parseInt(alunoId),
        academiaId
      }
    });

    return res.status(201).json(novoPagamento);
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar pagamento existente
router.put('/pagamentos/:id', [isAcademia], async (req, res) => {
  try {
    const userId = req.userId;
    const pagamentoId = parseInt(req.params.id);
    const { valor, dataPagamento, dataVencimento, status, formaPagamento, tipoPlano, observacoes } = req.body;

    if (isNaN(pagamentoId)) {
      return res.status(400).json({ error: 'ID do pagamento inválido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academia: true }
    });

    if (!user || user.role !== 'ACADEMIA' || !user.academia) {
      return res.status(403).json({ error: 'Acesso não autorizado. Usuário não é uma academia.' });
    }

    const academiaId = user.academia.id;

    // Verificar se o pagamento existe e pertence à academia
    const pagamento = await prisma.pagamento.findFirst({
      where: {
        id: pagamentoId,
        academiaId: academiaId
      }
    });

    if (!pagamento) {
      return res.status(404).json({ error: 'Pagamento não encontrado ou não pertence à sua academia' });
    }

    // Atualizar o pagamento
    const pagamentoAtualizado = await prisma.pagamento.update({
      where: { id: pagamentoId },
      data: {
        ...(valor && { valor: parseFloat(valor) }),
        ...(dataPagamento && { dataPagamento: new Date(dataPagamento) }),
        ...(dataVencimento && { dataVencimento: new Date(dataVencimento) }),
        ...(status && { status }),
        ...(formaPagamento && { formaPagamento }),
        ...(tipoPlano && { tipoPlano }),
        observacoes
      }
    });

    return res.status(200).json(pagamentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 