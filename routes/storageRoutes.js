import express from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile } from '../services/storageService.js';
import upload from '../middlewares/uploadMiddleware.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Rota para upload de avatar de usuário (aluno)
 */
router.post('/upload/avatar/aluno', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    
    // Verifica se o usuário existe e é um aluno
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferenciasAluno: true }
    });

    if (!user || !user.preferenciasAluno) {
      return res.status(404).json({ error: 'Usuário não encontrado ou não é um aluno' });
    }

    // Faz upload do arquivo para o bucket 'avatars' na pasta 'alunos'
    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'avatars',
      'alunos'
    );

    // Se já existe um avatar, exclui o antigo
    if (user.preferenciasAluno.alunoAvatar) {
      try {
        await deleteFile(user.preferenciasAluno.alunoAvatar, 'avatars');
      } catch (error) {
        console.error('Erro ao excluir avatar antigo:', error);
        // Continua mesmo se houver erro na exclusão do arquivo antigo
      }
    }

    // Atualiza o campo alunoAvatar no banco de dados
    await prisma.preferenciasAluno.update({
      where: { id: user.preferenciasAluno.id },
      data: { alunoAvatar: fileUrl }
    });

    res.json({ 
      message: 'Avatar atualizado com sucesso',
      avatarUrl: fileUrl 
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({ error: 'Erro ao processar o upload do avatar' });
  }
});

/**
 * Rota para upload de avatar de usuário (personal)
 */
router.post('/upload/avatar/personal', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    
    // Verifica se o usuário existe e é um personal
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferenciasPersonal: true }
    });

    if (!user || !user.preferenciasPersonal) {
      return res.status(404).json({ error: 'Usuário não encontrado ou não é um personal' });
    }

    // Faz upload do arquivo para o bucket 'avatars' na pasta 'personais'
    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'avatars',
      'personais'
    );

    // Se já existe um avatar, exclui o antigo
    if (user.preferenciasPersonal.personalAvatar) {
      try {
        await deleteFile(user.preferenciasPersonal.personalAvatar, 'avatars');
      } catch (error) {
        console.error('Erro ao excluir avatar antigo:', error);
        // Continua mesmo se houver erro na exclusão do arquivo antigo
      }
    }

    // Atualiza o campo personalAvatar no banco de dados
    await prisma.preferenciasPersonal.update({
      where: { id: user.preferenciasPersonal.id },
      data: { personalAvatar: fileUrl }
    });

    res.json({ 
      message: 'Avatar atualizado com sucesso',
      avatarUrl: fileUrl 
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({ error: 'Erro ao processar o upload do avatar' });
  }
});

/**
 * Rota para upload de avatar de academia
 */
router.post('/upload/avatar/academia', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    
    // Verifica se o usuário existe e é uma academia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academia: true }
    });

    if (!user || !user.academia) {
      return res.status(404).json({ error: 'Usuário não encontrado ou não é uma academia' });
    }

    // Faz upload do arquivo para o bucket 'avatars' na pasta 'academias'
    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'avatars',
      'academias'
    );

    // Se já existe um avatar, exclui o antigo
    if (user.academia.academiaAvatar) {
      try {
        await deleteFile(user.academia.academiaAvatar, 'avatars');
      } catch (error) {
        console.error('Erro ao excluir avatar antigo:', error);
        // Continua mesmo se houver erro na exclusão do arquivo antigo
      }
    }

    // Atualiza o campo academiaAvatar no banco de dados
    await prisma.academia.update({
      where: { id: user.academia.id },
      data: { academiaAvatar: fileUrl }
    });

    res.json({ 
      message: 'Avatar atualizado com sucesso',
      avatarUrl: fileUrl 
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({ error: 'Erro ao processar o upload do avatar' });
  }
});

/**
 * Rota para upload de avatar de aluno pela academia
 */
router.post('/upload/avatar/aluno/:alunoId', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    const alunoId = parseInt(req.params.alunoId);
    
    // Verifica se o usuário logado é uma academia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academia: true }
    });

    if (!user || !user.academia) {
      return res.status(403).json({ error: 'Apenas academias podem cadastrar avatares de alunos' });
    }

    // Verifica se o aluno existe e pertence à academia
    const aluno = await prisma.preferenciasAluno.findFirst({
      where: { 
        id: alunoId,
        academiaId: user.academia.id
      }
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado ou não pertence à academia' });
    }

    // Faz upload do arquivo para o bucket 'avatars' na pasta 'alunos'
    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'avatars',
      'alunos'
    );

    // Se já existe um avatar, exclui o antigo
    if (aluno.alunoAvatar) {
      try {
        await deleteFile(aluno.alunoAvatar, 'avatars');
      } catch (error) {
        console.error('Erro ao excluir avatar antigo:', error);
        // Continua mesmo se houver erro na exclusão do arquivo antigo
      }
    }

    // Atualiza o campo alunoAvatar no banco de dados
    await prisma.preferenciasAluno.update({
      where: { id: aluno.id },
      data: { alunoAvatar: fileUrl }
    });

    res.json({ 
      message: 'Avatar do aluno atualizado com sucesso',
      avatarUrl: fileUrl 
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar do aluno:', error);
    res.status(500).json({ error: 'Erro ao processar o upload do avatar do aluno' });
  }
});

/**
 * Rota para upload de avatar de personal pela academia
 */
router.post('/upload/avatar/personal/:personalId', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    const personalId = parseInt(req.params.personalId);
    
    // Verifica se o usuário logado é uma academia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { academia: true }
    });

    if (!user || !user.academia) {
      return res.status(403).json({ error: 'Apenas academias podem cadastrar avatares de personais' });
    }

    // Verifica se o personal existe e pertence à academia
    const personal = await prisma.preferenciasPersonal.findFirst({
      where: { 
        id: personalId,
        academiaId: user.academia.id
      }
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal não encontrado ou não pertence à academia' });
    }

    // Faz upload do arquivo para o bucket 'avatars' na pasta 'personais'
    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'avatars',
      'personais'
    );

    // Se já existe um avatar, exclui o antigo
    if (personal.personalAvatar) {
      try {
        await deleteFile(personal.personalAvatar, 'avatars');
      } catch (error) {
        console.error('Erro ao excluir avatar antigo:', error);
        // Continua mesmo se houver erro na exclusão do arquivo antigo
      }
    }

    // Atualiza o campo personalAvatar no banco de dados
    await prisma.preferenciasPersonal.update({
      where: { id: personal.id },
      data: { personalAvatar: fileUrl }
    });

    res.json({ 
      message: 'Avatar do personal atualizado com sucesso',
      avatarUrl: fileUrl 
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar do personal:', error);
    res.status(500).json({ error: 'Erro ao processar o upload do avatar do personal' });
  }
});

/**
 * Rota para upload de mídia de exercício
 */
router.post('/upload/exercise-media', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    const { exercicioId, tipo } = req.body;
    
    if (!exercicioId || !tipo) {
      return res.status(400).json({ error: 'ID do exercício e tipo de mídia são obrigatórios' });
    }
    
    if (!['image', 'video', 'gif'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de mídia inválido. Use: image, video ou gif' });
    }

    // Verifica se o usuário tem permissão (personal ou academia)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (user.role !== 'PERSONAL' && user.role !== 'ACADEMIA')) {
      return res.status(403).json({ error: 'Sem permissão para upload de mídia de exercício' });
    }

    // Verifica se o exercício existe
    const exercicio = await prisma.exercicio.findUnique({
      where: { id: parseInt(exercicioId) }
    });

    if (!exercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' });
    }

    // Faz upload do arquivo para o bucket 'exercises-media'
    const fileUrl = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      'exercises-media',
      tipo === 'image' ? 'images' : tipo === 'video' ? 'videos' : 'gifs'
    );

    // Atualiza o campo correspondente no banco de dados
    let updateData = {};
    
    if (tipo === 'image') {
      // Se já existe uma imagem, exclui a antiga
      if (exercicio.image) {
        try {
          await deleteFile(exercicio.image, 'exercises-media');
        } catch (error) {
          console.error('Erro ao excluir imagem antiga:', error);
        }
      }
      updateData = { image: fileUrl };
    } else if (tipo === 'video') {
      // Se já existe um vídeo, exclui o antigo
      if (exercicio.videoUrl) {
        try {
          await deleteFile(exercicio.videoUrl, 'exercises-media');
        } catch (error) {
          console.error('Erro ao excluir vídeo antigo:', error);
        }
      }
      updateData = { videoUrl: fileUrl };
    } else if (tipo === 'gif') {
      // Se já existe um GIF, exclui o antigo
      if (exercicio.gifUrl) {
        try {
          await deleteFile(exercicio.gifUrl, 'exercises-media');
        } catch (error) {
          console.error('Erro ao excluir GIF antigo:', error);
        }
      }
      updateData = { gifUrl: fileUrl };
    }

    await prisma.exercicio.update({
      where: { id: parseInt(exercicioId) },
      data: updateData
    });

    res.json({ 
      message: `Mídia do exercício (${tipo}) atualizada com sucesso`,
      url: fileUrl 
    });
  } catch (error) {
    console.error('Erro ao fazer upload de mídia de exercício:', error);
    res.status(500).json({ error: 'Erro ao processar o upload de mídia de exercício' });
  }
});

/**
 * Rota para adicionar URL de vídeo do YouTube a um exercício
 */
router.post('/exercicios/:exercicioId/youtube-video', authenticateToken, async (req, res) => {
  try {
    const { exercicioId } = req.params;
    const { videoUrl } = req.body;
    const userId = req.user.id;

    if (!videoUrl) {
      return res.status(400).json({ error: 'URL do vídeo é obrigatória' });
    }

    // Verificar se a URL é do formato de incorporação do YouTube
    if (!videoUrl.includes('youtube.com/embed/')) {
      return res.status(400).json({ error: 'URL inválida. Deve ser uma URL de incorporação do YouTube (youtube.com/embed/...)' });
    }

    // Verifica se o usuário tem permissão (personal ou academia)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (user.role !== 'PERSONAL' && user.role !== 'ACADEMIA')) {
      return res.status(403).json({ error: 'Sem permissão para adicionar vídeo ao exercício' });
    }

    // Verifica se o exercício existe
    const exercicio = await prisma.exercicio.findUnique({
      where: { id: parseInt(exercicioId) }
    });

    if (!exercicio) {
      return res.status(404).json({ error: 'Exercício não encontrado' });
    }

    // Atualiza o campo videoUrl no banco de dados
    await prisma.exercicio.update({
      where: { id: parseInt(exercicioId) },
      data: { videoUrl }
    });

    res.json({ 
      message: 'URL do vídeo do YouTube adicionada com sucesso',
      url: videoUrl 
    });
  } catch (error) {
    console.error('Erro ao adicionar URL do YouTube:', error);
    res.status(500).json({ error: 'Erro ao processar a adição da URL do YouTube' });
  }
});


/**
 * Rota para criar/atualizar exercício com mídias em uma única requisição
 * Esta rota permite adicionar um exercício com suas mídias em uma única operação
 */
router.post('/exercicio-com-midia', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      treinoId, 
      name, 
      sets, 
      time, 
      restTime, 
      repsPerSet, 
      status, 
      mediaType, 
      youtubeUrl 
    } = req.body;

    // Verificar se o usuário tem permissão (personal ou academia)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (user.role !== 'PERSONAL' && user.role !== 'ACADEMIA')) {
      return res.status(403).json({ error: 'Sem permissão para adicionar exercício' });
    }

    // Verificar dados obrigatórios do exercício
    if (!name || !sets || !time || !restTime || !repsPerSet || !treinoId) {
      return res.status(400).json({ error: 'Dados do exercício incompletos' });
    }

    // Verificar se o treino existe
    const treino = await prisma.treino.findUnique({
      where: { id: parseInt(treinoId) },
      include: { aluno: true }
    });

    if (!treino) {
      return res.status(404).json({ error: 'Treino não encontrado' });
    }

    // Se for personal, verificar se o aluno do treino está vinculado a ele
    if (user.role === 'PERSONAL') {
      const personal = await prisma.preferenciasPersonal.findUnique({
        where: { userId: userId }
      });

      if (!personal) {
        return res.status(404).json({ error: 'Perfil de personal não encontrado' });
      }

      if (treino.aluno.personalId !== personal.id) {
        return res.status(403).json({ error: 'Este treino pertence a um aluno não vinculado a este personal' });
      }
    }

    // Preparar dados do exercício
    const exercicioData = {
      name,
      sets: parseInt(sets),
      time,
      restTime,
      repsPerSet: parseInt(repsPerSet),
      status: status || 'not-started',
      treinoId: parseInt(treinoId),
      image: 'https://via.placeholder.com/150' // Imagem padrão
    };

    // Processar mídia, se houver
    let fileUrl = null;
    
    // Processar arquivo de mídia enviado
    if (req.file && mediaType) {
      if (!['image', 'video', 'gif'].includes(mediaType)) {
        return res.status(400).json({ error: 'Tipo de mídia inválido. Use: image, video ou gif' });
      }

      // Fazer upload do arquivo
      fileUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        'exercises-media',
        mediaType === 'image' ? 'images' : mediaType === 'video' ? 'videos' : 'gifs'
      );

      // Adicionar URL da mídia aos dados do exercício
      if (mediaType === 'image') {
        exercicioData.image = fileUrl;
      } else if (mediaType === 'video') {
        exercicioData.videoUrl = fileUrl;
      } else if (mediaType === 'gif') {
        exercicioData.gifUrl = fileUrl;
      }
    }
    
    // Processar URL do YouTube, se fornecida
    if (youtubeUrl && youtubeUrl.includes('youtube.com/embed/')) {
      exercicioData.videoUrl = youtubeUrl;
    }

    // Criar o exercício com todos os dados
    const novoExercicio = await prisma.exercicio.create({
      data: exercicioData
    });

    res.status(201).json({
      message: 'Exercício criado com sucesso',
      exercicio: novoExercicio
    });
  } catch (error) {
    console.error('Erro ao criar exercício com mídia:', error);
    res.status(500).json({ error: 'Erro ao processar a criação do exercício com mídia' });
  }
});

export default router; 