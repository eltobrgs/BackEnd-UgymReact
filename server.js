import express from 'express';
import authRoutes from './routes/authRoutes.js';
import alunoRoutes from './routes/alunoRoutes.js';
import personalRoutes from './routes/personalRoutes.js';
import academiaRoutes from './routes/academiaRoutes.js';
import geralUserRoutes from './routes/geralUserRoutes.js';
import cors from 'cors';
const app = express();

// Middleware para JSON
app.use(express.json());
app.use(cors({ origin: '*' })); // Permite requisições de qualquer origem

// Rotas divididas por responsabilidade
app.use('/', authRoutes); // Rotas públicas de autenticação
app.use('/', alunoRoutes); // Rotas para alunos
app.use('/', personalRoutes); // Rotas para personal trainers
app.use('/', academiaRoutes); // Rotas para academias
app.use('/', geralUserRoutes); // Rotas gerais para qualquer usuário autenticado

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});