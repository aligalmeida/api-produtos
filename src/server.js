require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/db');
const authRouter = require('./routes/authRouter');
const produtosRouter = require('./routes/produtosRouter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Healthcheck
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Auth (login para obter token)
app.use(authRouter);

// Rotas de Produtos (CRUD) — com proteção aplicada no router
app.use(produtosRouter);

// Conecta ao banco e inicia o servidor
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log('✅ Conectado ao MongoDB Atlas!');
      console.log(`🚀 API em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar no banco:', err.message);
    process.exit(1);
  });

module.exports = app;
