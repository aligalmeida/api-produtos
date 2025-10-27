// src/utils/health.js
const os = require('os');
const process = require('process');
const Produto = require('../models/produtoModel');
let pkg;
try {
  pkg = require('../../package.json');
} catch {
  pkg = { version: 'unknown' };
}

/**
 * Checa o status do MongoDB e coleta métricas básicas
 */
async function checkMongo(mongoose) {
  const mongo = {
    status: 'down',
    latency_ms: null,
    database: { name: null, collections: null, produtos_count: null },
  };
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Mongo not connected');
    }
    const db = mongoose.connection.db;
    mongo.database.name = db.databaseName;
    const start = process.hrtime.bigint();
    const adminDb = db.admin();
    await adminDb.ping();
    const end = process.hrtime.bigint();
    mongo.latency_ms = Number(end - start) / 1_000_000; // converte ns para ms
    mongo.status = 'ok';
    // Coleta estatísticas (sem travar o health)
    try {
      const cols = await db.listCollections().toArray();
      mongo.database.collections = cols.length;
      mongo.database.produtos_count = await Produto.countDocuments();
    } catch {
      mongo.database.collections = 'error';
    }
  } catch (e) {
    mongo.status = 'down';
  }
  return mongo;
}

/**
 * Coleta todas as informações de saúde da aplicação
 */
async function getHealthInfo(mongoose) {
  const mem = process.memoryUsage();
  const load = os.loadavg();
  const mongo = await checkMongo(mongoose);
  
  const health = {
    ts: new Date().toISOString(),
    status: mongo.status === 'ok' ? 'ok' : 'degraded',
    version: pkg.version || '1.0.0',
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    pid: process.pid,
    host: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      loadavg1m: load[0],
    },
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    },
    mongo: mongo,
  };
  
  return health;
}

/**
 * Verifica se a requisição prefere HTML (browser)
 */
function wantsHtml(req) {
  const accepts = req.accepts(['html', 'json']);
  return accepts === 'html';
}

/**
 * Renderiza o HTML (função que você já tinha)
 */
function renderHealthHTML(info) {
  const badge =
    info.status === 'ok' ? 'ok' :
    info.status === 'degraded' ? 'warn' : 'bad';
  const fmtBytes = (n) => `${(n / (1024 * 1024)).toFixed(1)} MB`;
  const latency = info.mongo.latency_ms != null ? `${info.mongo.latency_ms.toFixed(1)} ms` : '—';
  const dbName = info.mongo.database.name || '—';
  const dbCols = info.mongo.database.collections != null ? info.mongo.database.collections : '—';
  const dbProdutos = info.mongo.database.produtos_count != null ? info.mongo.database.produtos_count : '—';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Health · API Produtos</title>
<style>
:root{
  --bg:#0b1220; --panel:#0f172a; --panel2:#111827; --border:#1f2937;
  --muted:#9ca3af; --text:#e5e7eb; --accent:#22d3ee;
  --ok:#16a34a; --warn:#f59e0b; --bad:#ef4444;
}
*{box-sizing:border-box}
body{margin:0;background:linear-gradient(180deg,#0b1220,#0f172a);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
main{max-width:960px;margin:0 auto;padding:24px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
section{background:rgba(17,24,39,.75);border:1px solid var(--border);border-radius:16px;
  padding:16px;margin-bottom:16px;backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.25)}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
article{background:rgba(15,23,42,.75);border:1px solid var(--border);border-radius:12px;padding:12px}
dl{display:flex;justify-content:space-between;margin:0;gap:8px}
dt{color:var(--muted);font-weight:600}
dd{margin:0;text-align:right}
.badge{display:inline-block;padding:4px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);font-weight:700}
.badge.ok{background:rgba(22,163,74,.12);border-color:#14532d;color:#86efac}
.badge.warn{background:rgba(245,158,11,.12);border-color:#7c2d12;color:#fde68a}
.badge.bad{background:rgba(239,68,68,.12);border-color:#7f1d1d;color:#fecaca}
nav a{color:var(--accent);text-decoration:none;border:1px solid var(--border);padding:8px 12px;border-radius:8px;margin-right:8px}
footer{margin-top:10px;color:var(--muted);font-size:12px;text-align:center}
</style>
</head>
<body>
  <main>
    <header>
      <h1>Healthcheck</h1>
      <span class="badge ${badge}">${info.status.toUpperCase()}</span>
    </header>
    <section aria-label="informações da aplicação">
      <div class="grid">
        <article>
          <h3>Aplicação</h3>
          <dl><dt>Status</dt><dd>${info.status}</dd></dl>
          <dl><dt>Versão</dt><dd>${info.version}</dd></dl>
          <dl><dt>Node</dt><dd>${info.node}</dd></dl>
          <dl><dt>Ambiente</dt><dd>${info.env}</dd></dl>
          <dl><dt>Uptime</dt><dd>${info.uptime}s</dd></dl>
          <dl><dt>PID</dt><dd>${info.pid}</dd></dl>
        </article>
        <article>
          <h3>MongoDB</h3>
          <dl><dt>Status</dt><dd>${info.mongo.status}</dd></dl>
          <dl><dt>Latência</dt><dd>${latency}</dd></dl>
          <dl><dt>Database</dt><dd>${dbName}</dd></dl>
          <dl><dt>Coleções</dt><dd>${dbCols}</dd></dl>
          <dl><dt>produtos (docs)</dt><dd>${dbProdutos}</dd></dl>
        </article>
        <article>
          <h3>Host</h3>
          <dl><dt>Hostname</dt><dd>${info.host.hostname}</dd></dl>
          <dl><dt>Plataforma</dt><dd>${info.host.platform}/${info.host.arch}</dd></dl>

          <dl><dt>Load 1m</dt><dd>${(Number(info.host.loadavg1m)||0).toFixed(2)}</dd></dl>
        </article>
        <article>
          <h3>Memória</h3>
          <dl><dt>RSS</dt><dd>${fmtBytes(info.memory.rss)}</dd></dl>
          <dl><dt>Heap Used</dt><dd>${fmtBytes(info.memory.heapUsed)}</dd></dl>
          <dl><dt>Heap Total</dt><dd>${fmtBytes(info.memory.heapTotal)}</dd></dl>
        </article>
      </div>
      <aside style="margin-top: 16px;">
        <nav>
          <a href="/api/v1/produtos">Produtos</a>
          <a href="/docs">Swagger</a>
          <a href="/health.json">Ver JSON</a>
        </nav>
      </aside>
    </section>
    <footer>Atualizado em ${new Date(info.ts).toLocaleString()}</footer>
  </main>
</body>
</html>`;
}

// Exporta as 3 funções que o server.js precisa
module.exports = {
  getHealthInfo,
  wantsHtml,
  renderHealthHTML,
};
