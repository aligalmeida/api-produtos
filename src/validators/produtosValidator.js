// Validações de Produto (create, PUT, PATCH) - feature/validators-produtos

const mongoose = require('mongoose');
const { CATEGORIAS } = require('../models/produtoModel');

const ALLOWED = ['nome', 'preco', 'sku', 'categoria', 'estoque', 'ativo'];

function unknown(body) { return Object.keys(body).filter(k => !ALLOWED.includes(k)); }
const isNum = n => typeof n === 'number' && Number.isFinite(n);
const toNum = v => (v === '' || v === null || v === undefined) ? NaN : Number(v);
const notEmpty = s => typeof s === 'string' && s.trim().length > 0;
const skuOK = s => /^[A-Z0-9-]{6,20}$/.test(String(s).toUpperCase());
const preco2casas = v => Number.isFinite(v) && Number.isInteger(Math.round(v * 100));

/** Valida corpo comum (criar/atualizar) */
function validate(body, { requireAll = false, allowEmpty = false } = {}) {
  const errors = [];
  const sanitized = {};

  const unk = unknown(body);
  if (unk.length) errors.push({ field: 'body', msg: `Campos não permitidos: ${unk.join(', ')}` });

  // nome
  if (requireAll || 'nome' in body) {
    if (!notEmpty(body.nome)) errors.push({ field: 'nome', msg: 'Nome é obrigatório e string não vazia' });
    else if (body.nome.trim().length < 3 || body.nome.trim().length > 60)
      errors.push({ field: 'nome', msg: 'Nome deve ter entre 3 e 60 caracteres' });
    else sanitized.nome = String(body.nome).trim();
  }

  // preco
  if (requireAll || 'preco' in body) {
    const v = toNum(body.preco);
    if (!isNum(v)) errors.push({ field: 'preco', msg: 'Preço deve ser numérico' });
    else if (v < 0.01) errors.push({ field: 'preco', msg: 'Preço deve ser maior que 0' });
    else if (v > 100000) errors.push({ field: 'preco', msg: 'Preço excede o limite permitido' });
    else if (!preco2casas(v)) errors.push({ field: 'preco', msg: 'Preço deve ter no máximo 2 casas decimais' });
    else sanitized.preco = v;
  }

  // sku (opcional)
  if ('sku' in body && body.sku != null && body.sku !== '') {
    if (!notEmpty(body.sku) || !skuOK(body.sku))
      errors.push({ field: 'sku', msg: 'SKU deve conter 6–20 (A-Z, 0-9, -)' });
    else sanitized.sku = String(body.sku).toUpperCase().trim();
  }

  // categoria (opcional)
  if ('categoria' in body && body.categoria != null && body.categoria !== '') {
    if (!CATEGORIAS.includes(String(body.categoria)))
      errors.push({ field: 'categoria', msg: `Categoria inválida. Use: ${CATEGORIAS.join(', ')}` });
    else sanitized.categoria = String(body.categoria);
  }

  // estoque (opcional)
  if ('estoque' in body) {
    const e = toNum(body.estoque);
    if (!Number.isInteger(e) || e < 0) errors.push({ field: 'estoque', msg: 'Estoque deve ser inteiro ≥ 0' });
    else sanitized.estoque = e;
  }

  // ativo (opcional)
  if ('ativo' in body) {
    const v = body.ativo;
    if (typeof v !== 'boolean') errors.push({ field: 'ativo', msg: 'Ativo deve ser booleano' });
    else sanitized.ativo = v;
  }

  if (!allowEmpty && !requireAll) {
    const hasField = Object.keys(body).some(k => ALLOWED.includes(k));
    if (!hasField) errors.push({ field: 'body', msg: 'Informe ao menos um campo válido para atualizar' });
  }

  return { errors, sanitized };
}

function validarCriar(req, res, next) {
  const { errors, sanitized } = validate(req.body || {}, { requireAll: true });
  if (errors.length) return res.status(422).json({ errors });
  req.body = sanitized;
  next();
}

function validarPUT(req, res, next) {
  const { errors, sanitized } = validate(req.body || {}, { requireAll: true });
  if (errors.length) return res.status(422).json({ errors });
  req.body = sanitized;
  next();
}

function validarPATCH(req, res, next) {
  const { errors, sanitized } = validate(req.body || {}, { requireAll: false, allowEmpty: false });
  if (errors.length) return res.status(422).json({ errors });
  req.body = sanitized;
  next();
}

/** Params: :id precisa ser ObjectId válido */
function validarIdParam(req, res, next) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ errors: [{ field: 'id', msg: 'Parâmetro id inválido' }] });
  }
  next();
}

/** Query da listagem: q, categoria, ativo, page, limit */
function validarQueryListar(req, res, next) {
  const errors = [];
  const q = req.query.q;
  const categoria = req.query.categoria;
  const ativo = req.query.ativo;
  const page = req.query.page;
  const limit = req.query.limit;

  if (q !== undefined && typeof q !== 'string') {
    errors.push({ field: 'q', msg: 'q deve ser string' });
  }
  if (categoria !== undefined && !CATEGORIAS.includes(String(categoria))) {
    errors.push({ field: 'categoria', msg: `Categoria inválida. Use: ${CATEGORIAS.join(', ')}` });
  }
  if (ativo !== undefined && !['true', 'false', true, false].includes(ativo)) {
    errors.push({ field: 'ativo', msg: 'ativo deve ser booleano (true/false)' });
  } else if (ativo !== undefined) {
    req.query.ativo = (ativo === true || ativo === 'true');
  }

  if (page !== undefined) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1) errors.push({ field: 'page', msg: 'page deve ser inteiro ≥ 1' });
    else req.query.page = p;
  }
  if (limit !== undefined) {
    const l = Number(limit);
    if (!Number.isInteger(l) || l < 1 || l > 100) errors.push({ field: 'limit', msg: 'limit deve ser inteiro entre 1 e 100' });
    else req.query.limit = l;
  }

  if (errors.length) return res.status(422).json({ errors });
  next();
}

module.exports = {
  validarCriar,
  validarPUT,
  validarPATCH,
};
