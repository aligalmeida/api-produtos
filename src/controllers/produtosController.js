const mongoose = require('mongoose');
const Produto = require('../models/produtoModel');

// POST /produtos
async function criar(req, res) {
  try {
    const { nome, preco } = req.body || {};
    if (nome == null || preco == null) {
      return res.status(422).json({ msg: 'Nome e preço do produto são obrigatórios' });
    }
    const novo = await Produto.create({ nome, preco });
    return res.status(201).json(novo);
  } catch {
    return res.status(422).json({ msg: 'Nome e preço do produto são obrigatórios' });
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
  const { nome, preco } = req.body || {};
  if (nome == null || preco == null) {
    return res.status(422).json({ msg: 'Nome e preço do produto são obrigatórios' });
  }
  try {
    const atualizado = await Produto.findOneAndUpdate(
      { _id: req.params.id },
      { nome, preco },
      { new: true, runValidators: true }
    );
    return res.status(200).json(atualizado);
  } catch {
    return res.status(422).json({ msg: 'Nome e preço do produto são obrigatórios' });
  }
}

// PATCH /produtos/:id (atualização parcial)
async function atualizarParcial(req, res) {
  const campos = {};
  if ('nome' in req.body) campos.nome = req.body.nome;
  if ('preco' in req.body) campos.preco = req.body.preco;

  if (Object.keys(campos).length === 0) {
    return res.status(422).json({ msg: 'Informe ao menos um campo para atualizar' });
  }

  try {
    const atualizado = await Produto.findOneAndUpdate(
      { _id: req.params.id },
      campos,
      { new: true, runValidators: true }
    );
    return res.status(200).json(atualizado);
  } catch {
    return res.status(422).json({ msg: 'Dados inválidos' });
  }
}

// DELETE /produtos/:id
async function remover(req, res) {
  await Produto.findByIdAndDelete(req.params.id);
  return res.status(204).send();
}

module.exports = {
  criar,
  listar,
  buscar,
  exibir,
  atualizar,
  atualizarParcial,
  remover
};
