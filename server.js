import express from 'express';
import publicRoutes from './routes/public.js';
import privateRoutes from './routes/private.js';
import cors from 'cors';
const app = express();

// Middleware para JSON
app.use(express.json());
app.use(cors({ origin: '*' })); // Permite requisições de qualquer origem

// Rotas públicas
app.use('/', publicRoutes);

// Rotas privadas
app.use('/', privateRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`http://localhost:${PORT}`);

});