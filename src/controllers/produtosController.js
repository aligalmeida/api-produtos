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

    // Regra de negócio: nome único
    if (await existeNomeDuplicado(nome)) {
      return res.status(409).json({ msg: 'Já existe um produto com este nome' });
    }

    const payload = { nome, preco, sku, categoria, estoque, ativo, nomeLower: nome.trim().toLowerCase() };
    const novo = await Produto.create(payload);

    // 201 + Location
    res.setHeader('Location', `${req.baseUrl}/${novo._id}`);
    return res.status(201).json(novo);
  } catch (err) {
    return res.status(422).json({ msg: 'Dados inválidos', detail: err.message });
  }
}

// GET /produtos
async function listar(_req, res) {
  const itens = await Produto.find({});
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
      // Se quiser semântica de PUT "substituir tudo", use: { new: true, runValidators: true, overwrite: true }
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
    if (nome !== undefined) {
      payload.nome = nome;
      payload.nomeLower = nome.trim().toLowerCase();
    }
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
  // Regra de negócio: não permitir remover com estoque > 0
  if (req.produto.estoque > 0) {
    return res.status(409).json({ msg: 'Não é possível remover produto com estoque maior que 0' });
  }
  await Produto.findByIdAndDelete(req.params.id);
  return res.status(204).send();
}

module.exports = {
  criar,
  listar,
  buscar,              // <- agora está definido acima
  exibir,
  atualizar,
  atualizarParcial,
  remover,
};
