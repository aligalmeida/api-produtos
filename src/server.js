// src/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');

// Conexão com o banco
const { connectDB } = require('./config/db');

// Swagger (OpenAPI a partir de YAML)
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));

// Rotas
const authRouter = require('./routes/authRouter');
const produtosRouter = require('./routes/produtosRouter');

const app = express();
const API_PREFIX = '/api/v1';

// Hardening básico
app.disable('x-powered-by');

// Body parser
app.use(express.json());

// ---------- Documentação Swagger ----------
// acessível em: http://localhost:3000/docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'API Produtos - Documentação',
}));

// ---------- Healthcheck (sem versão por convenção) ----------
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', ts: new Date().toISOString() });
});

// ---------- Rotas versionadas ----------
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/produtos`, produtosRouter);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Rota não encontrada' });
});

// ---------- Handler global de erros ----------
app.use((err, _req, res, _next) => {
  console.error('Erro não tratado:', err);
  if (res.headersSent) return;
  const status = Number.isInteger(err?.status) ? err.status : 500;
  res.status(status).json({
    error: status === 500 ? 'InternalServerError' : 'Error',
    message: err.message || 'Erro interno do servidor'
  });
});

// ---------- Inicialização (compatível com testes) ----------
async function boot() {
  await connectDB();
  const PORT = process.env.PORT || 3000;
  return app.listen(PORT, () => {
    console.log(`✅ API rodando em http://localhost:${PORT}${API_PREFIX}`);
    console.log(`📄 Swagger:             http://localhost:${PORT}/docs`);
    console.log(`❤️ Healthcheck:         http://localhost:${PORT}/health`);
  });
}

// Fora do ambiente de teste, inicia o servidor
if (process.env.NODE_ENV !== 'test') {
  boot().catch((err) => {
    console.error('❌ Erro ao iniciar a aplicação:', err);
    process.exit(1);
  });
}

module.exports = { app, boot };





