// src/server.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

// Conexão com MongoDB
const { connectDB } = require('./config/db');

// Swagger (OpenAPI a partir de YAML) — carregamento resiliente
const swaggerUi = require('swagger-ui-express');
let swaggerDocument = null;
try {
  const YAML = require('yamljs');
  const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
  if (fs.existsSync(openapiPath)) {
    swaggerDocument = YAML.load(openapiPath);
  } else {
    console.warn('⚠️  openapi.yaml não encontrado em src/docs/openapi.yaml. Swagger ficará com placeholder.');
  }
} catch (e) {
  console.warn('⚠️  Falha ao carregar Swagger/OpenAPI:', e.message);
}

// Rotas
const authRouter = require('./routes/authRouter');
const produtosRouter = require('./routes/produtosRouter');

// Health utils (HTML bonito + métricas)
const { getHealthInfo, wantsHtml, renderHealthHTML } = require('./utils/health');

const app = express();
const API_PREFIX = '/api/v1';

// ---------- Hardening básico ----------
app.disable('x-powered-by');

// ---------- Parsers ----------
app.use(express.json());

// ---------- JSON legível no dev ----------
app.set('json spaces', 2);

// ---------- Swagger Docs ----------
if (swaggerDocument) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'API Produtos - Documentação',
  }));
} else {
  // Fallback simples para não derrubar a app
  app.get('/docs', (_req, res) => {
    res.status(200).send(`<!doctype html>
      <meta charset="utf-8"/>
      <title>Docs</title>
      <style>body{font-family:system-ui;margin:32px}</style>
      <h1>Swagger</h1>
      <p>O arquivo <code>src/docs/openapi.yaml</code> não foi encontrado ou não pôde ser carregado.</p>
      <p>A API está rodando. Assim que o arquivo for criado, recarregue esta página.</p>`);
  });
}

// ---------- Healthcheck (HTML no browser, JSON para clients) ----------
app.get('/health', async (req, res) => {
  const info = await getHealthInfo(mongoose);
  const statusCode = info.status === 'ok' ? 200 : info.status === 'degraded' ? 200 : 503;

  if (wantsHtml(req)) {
    return res.type('html').status(statusCode).send(renderHealthHTML(info));
  }
  return res.status(statusCode).json(info);
});

// Atalho para JSON puro do health
app.get('/health.json', async (_req, res) => {
  const info = await getHealthInfo(mongoose);
  const statusCode = info.status === 'ok' ? 200 : info.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(info);
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
    message: err.message || 'Erro interno do servidor',
  });
});

// ---------- Inicialização (resiliente para depuração) ----------
async function boot() {
  // Tenta conectar no Mongo; se falhar, continua rodando (health mostrará "degraded" ou "down")
  try {
    await connectDB();
    console.log('✅ Conectado ao MongoDB');
  } catch (e) {
    console.error('⚠️  Falha ao conectar no MongoDB:', e.message);
    console.error('⚠️  Continuando sem banco para depuração (health indicará problema de Mongo).');
  }

  const PORT = process.env.PORT || 3000;
  return app.listen(PORT, () => {
    console.log(`✅ API rodando em http://localhost:${PORT}${API_PREFIX}`);
    console.log(`📄 Swagger:       http://localhost:${PORT}/docs`);
    console.log(`❤️ Healthcheck:   http://localhost:${PORT}/health`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  boot().catch((err) => {
    console.error('❌ Erro ao iniciar a aplicação:', err);
    process.exit(1);
  });
}

module.exports = { app, boot };



