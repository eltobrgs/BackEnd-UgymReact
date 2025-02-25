import express from 'express';
import publicRoutes from './routes/public.js';
import privateRoutes from './routes/private.js';

const app = express();

// Middleware para JSON
app.use(express.json());

// Rotas públicas
app.use('/api', publicRoutes);

// Rotas privadas
app.use('/api', privateRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});