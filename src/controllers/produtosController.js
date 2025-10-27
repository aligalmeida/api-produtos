// src/controllers/produtosController.js
const mongoose = require('mongoose');
const Produto = require('../models/produtoModel');

// Utilitário: checa se já existe outro produto com mesmo nome (case-insensitive)
async function existeNomeDuplicado(nome, idAtual = null) {
  const nomeLower = String(nome).trim().toLowerCase();
  const filtro = { nomeLower };
  if (idAtual) filtro._id = { $ne: idAtual };
  const existente = await Produto.findOne(filtro).lean();
  return Boolean(existente);
}

// POST /produtos
async function criar(req, res) {
  try {
    const { nome, preco, sku, categoria, estoque, ativo } = req.body || {};
    if (await existeNomeDuplicado(nome)) {
      return res.status(409).json({ msg: 'Já existe um produto com este nome' });
    }
    const payload = { nome, preco, sku, categoria, estoque, ativo, nomeLower: nome.trim().toLowerCase() };
    const novo = await Produto.create(payload);
    res.setHeader('Location', `${req.baseUrl}/${novo._id}`);
    return res.status(201).json(novo);
  } catch (err) {
    return res.status(422).json({ msg: 'Dados inválidos', detail: err.message });
  }
}

/**
 * GET /produtos
 * - Navegador: HTML semântico bonito (tabela responsiva + filtros)
 * - Clientes (Postman/cURL/SDKs): JSON
 * - Forçar JSON: /produtos.json ou ?format=json
 * Filtros: q (nome/sku), categoria, ativo
 * Ordenação: sort=campo:dir (nome|preco|estoque|createdAt|updatedAt : asc|desc)
 */
async function listar(req, res) {
  const { q, categoria, ativo, sort = 'nome:asc' } = req.query || {};

  const filtro = {};
  if (q && String(q).trim()) {
    const txt = String(q).trim();
    filtro.$or = [
      { nome: { $regex: txt, $options: 'i' } },
      { sku:  { $regex: txt, $options: 'i' } }
    ];
  }
  if (categoria && ['frutas','bebidas','higiene','outros'].includes(String(categoria))) {
    filtro.categoria = categoria;
  }
  if (ativo === 'true' || ativo === 'false') {
    filtro.ativo = ativo === 'true';
  }

  const [campoSort, dirSort] = String(sort).split(':');
  const sortObj = {};
  if (campoSort && ['nome','preco','estoque','createdAt','updatedAt'].includes(campoSort)) {
    sortObj[campoSort] = dirSort === 'desc' ? -1 : 1;
  } else {
    sortObj.nome = 1;
  }

  const itens = await Produto.find(filtro).sort(sortObj).lean();

  // ---- Content Negotiation ----
  const forceJson = (req.query.format || '').toLowerCase() === 'json' || req.path.endsWith('.json');
  const prefers = req.accepts(['html', 'json']); // 'html' | 'json' | false
  const wantsJson = forceJson || prefers === 'json';

  if (!wantsJson) {
    return res
      .type('html')
      .status(200)
      .send(renderProdutosTableHTML({ itens, query: req.query }));
  }

  return res.status(200).json(itens);
}

// middleware: valida id e carrega produto
async function buscar(req, res, next) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Parâmetro inválido' });
  }
  const produto = await Produto.findById(id);
  if (!produto) return res.status(404).json({ msg: 'Produto não encontrado' });
  req.produto = produto;
  return next();
}

// GET /produtos/:id
function exibir(req, res) {
  return res.status(200).json(req.produto);
}

// PUT /produtos/:id (atualização total)
async function atualizar(req, res) {
  const { nome, preco, sku, categoria, estoque, ativo } = req.body || {};
  try {
    if (nome && (await existeNomeDuplicado(nome, req.params.id))) {
      return res.status(409).json({ msg: 'Já existe um produto com este nome' });
    }
    const payload = { nome, preco, sku, categoria, estoque, ativo };
    if (nome) payload.nomeLower = nome.trim().toLowerCase();

    const atualizado = await Produto.findOneAndUpdate(
      { _id: req.params.id },
      payload,
      { new: true, runValidators: true }
    );
    return res.status(200).json(atualizado);
  } catch (err) {
    return res.status(422).json({ msg: 'Dados inválidos', detail: err.message });
  }
}

// PATCH /produtos/:id (atualização parcial)
async function atualizarParcial(req, res) {
  const { nome, preco, sku, categoria, estoque, ativo } = req.body || {};
  try {
    if (nome && (await existeNomeDuplicado(nome, req.params.id))) {
      return res.status(409).json({ msg: 'Já existe um produto com este nome' });
    }
    const payload = {};
    if (nome !== undefined) { payload.nome = nome; payload.nomeLower = nome.trim().toLowerCase(); }
    if (preco !== undefined) payload.preco = preco;
    if (sku !== undefined) payload.sku = sku;
    if (categoria !== undefined) payload.categoria = categoria;
    if (estoque !== undefined) payload.estoque = estoque;
    if (ativo !== undefined) payload.ativo = ativo;

    const atualizado = await Produto.findOneAndUpdate(
      { _id: req.params.id },
      payload,
      { new: true, runValidators: true }
    );
    return res.status(200).json(atualizado);
  } catch (err) {
    return res.status(422).json({ msg: 'Dados inválidos', detail: err.message });
  }
}

// DELETE /produtos/:id
async function remover(req, res) {
  if (req.produto.estoque > 0) {
    return res.status(409).json({ msg: 'Não é possível remover produto com estoque maior que 0' });
  }
  await Produto.findByIdAndDelete(req.params.id);
  return res.status(204).send();
}

/* =========================
   HTML semântico (table)
   ========================= */
function renderProdutosTableHTML({ itens = [], query = {} }) {
  const sel = (v, exp) => String(v || '') === String(exp || '') ? 'selected' : '';

  const bodyRows = itens.map(p => `
      <tr>
        <td class="mono">${escapeHtml(p._id)}</td>
        <td>${escapeHtml(p.nome)}</td>
        <td class="num">R$ ${Number(p.preco).toFixed(2)}</td>
        <td class="mono">${escapeHtml(p.sku || '-')}</td>
        <td>${escapeHtml(p.categoria)}</td>
        <td class="num">${p.estoque}</td>
        <td>${p.ativo ? '<span class="pill ok">Ativo</span>' : '<span class="pill bad">Inativo</span>'}</td>
        <td class="muted small">
          <div>criado: ${fmtDt(p.createdAt)}</div>
          <div>atualizado: ${fmtDt(p.updatedAt)}</div>
        </td>
      </tr>
  `).join('') || `
      <tr><td colspan="8" class="empty">Nenhum produto encontrado.</td></tr>
  `;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Produtos · API</title>
<style>
:root{
  --bg:#0b1220; --panel:#0f172a; --panel2:#111827; --border:#1f2937;
  --muted:#9ca3af; --text:#e5e7eb; --accent:#22d3ee;
  --ok:#16a34a; --bad:#ef4444;
}
*{box-sizing:border-box}
body{margin:0;background:linear-gradient(180deg,#0b1220,#0f172a);color:var(--text);
  font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
main{max-width:1200px;margin:0 auto;padding:24px}
header.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
h1{margin:0;font-size:22px}
nav a{color:var(--accent);text-decoration:none;border:1px solid var(--border);padding:8px 12px;border-radius:8px;margin-left:8px}
section.panel{background:rgba(17,24,39,.75);border:1px solid var(--border);border-radius:16px;
  padding:16px;backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,.25)}
form.filters{display:grid;grid-template-columns:1.2fr .8fr .8fr .8fr auto;gap:10px;align-items:end;margin-bottom:8px}
input,select,button{background:var(--panel2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:10px 12px;outline:none}
button{background:var(--accent);color:#06202a;border:none;font-weight:700;cursor:pointer}
small{color:var(--muted)}
.table-wrap{overflow:auto;border-radius:12px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse}
thead{background:#0b1324;position:sticky;top:0}
th,td{padding:10px;border-bottom:1px solid var(--border);vertical-align:top}
th{text-align:left;color:var(--muted);font-weight:700;font-size:13px}
td.num{text-align:right}
td.mono{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:12px}
td.small{font-size:12px}
.empty{text-align:center;color:var(--muted)}
.counter{color:var(--muted);margin:8px 2px 0}
.pill{padding:2px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);font-size:12px}
.pill.ok{background:rgba(22,163,74,.12);border-color:#14532d;color:#86efac}
.pill.bad{background:rgba(239,68,68,.12);border-color:#7f1d1d;color:#fecaca}
@media (max-width:900px){ form.filters{grid-template-columns:1fr 1fr 1fr} th:nth-child(1),td:nth-child(1){display:none} }
</style>
</head>
<body>
  <main>
    <header class="top">
      <h1>Produtos</h1>
      <nav>
        <a href="/api/v1/produtos.json">Ver JSON</a>
        <a href="/docs">Swagger</a>
      </nav>
    </header>

    <section class="panel" aria-label="filtros e tabela de produtos">
      <form class="filters" method="get" action="/api/v1/produtos">
        <label>
          <small>Busca (nome ou SKU)</small><br/>
          <input name="q" placeholder="ex.: teclado, NOTE-123" value="${escapeAttr(query.q || '')}"/>
        </label>
        <label>
          <small>Categoria</small><br/>
          <select name="categoria">
            <option value="">(todas)</option>
            <option value="frutas" ${sel(query.categoria,'frutas')}>frutas</option>
            <option value="bebidas" ${sel(query.categoria,'bebidas')}>bebidas</option>
            <option value="higiene" ${sel(query.categoria,'higiene')}>higiene</option>
            <option value="outros" ${sel(query.categoria,'outros')}>outros</option>
          </select>
        </label>
        <label>
          <small>Status</small><br/>
          <select name="ativo">
            <option value="">(todos)</option>
            <option value="true" ${sel(query.ativo,'true')}>Ativos</option>
            <option value="false" ${sel(query.ativo,'false')}>Inativos</option>
          </select>
        </label>
        <label>
          <small>Ordenar por</small><br/>
          <select name="sort">
            <option value="nome:asc" ${sel(query.sort,'nome:asc')}>Nome (A→Z)</option>
            <option value="nome:desc" ${sel(query.sort,'nome:desc')}>Nome (Z→A)</option>
            <option value="preco:asc" ${sel(query.sort,'preco:asc')}>Preço (menor→maior)</option>
            <option value="preco:desc" ${sel(query.sort,'preco:desc')}>Preço (maior→menor)</option>
            <option value="estoque:desc" ${sel(query.sort,'estoque:desc')}>Estoque (maior→menor)</option>
            <option value="createdAt:desc" ${sel(query.sort,'createdAt:desc')}>Mais recentes</option>
            <option value="updatedAt:desc" ${sel(query.sort,'updatedAt:desc')}>Atualizados</option>
          </select>
        </label>
        <button type="submit">Filtrar</button>
      </form>

      <div class="counter">${itens.length} item(s) encontrados</div>

      <div class="table-wrap" role="region" aria-label="Tabela de produtos" tabindex="0">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Preço</th>
              <th>SKU</th>
              <th>Categoria</th>
              <th>Estoque</th>
              <th>Ativo</th>
              <th>Criado / Atualizado</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="8"><small>Renderizado em ${new Date().toLocaleString()}</small></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
function escapeAttr(s = '') { return escapeHtml(s).replaceAll('"','&quot;'); }
function fmtDt(dt) { try { return new Date(dt).toLocaleString(); } catch { return '-' } }

module.exports = {
  criar,
  listar,
  buscar,
  exibir,
  atualizar,
  atualizarParcial,
  remover,
};
