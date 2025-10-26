// src/routes/produtosRouter.js
const express = require('express');

const auth = require('../middleware/auth');                  // -> deve exportar { verificarJWT }
const validators = require('../validators/produtosValidator'); // -> deve exportar { validarCriar, validarPUT, validarPATCH }
const ctrl = require('../controllers/produtosController');     // -> deve exportar todas as funções do CRUD

const router = express.Router();

// Desestrutura
const { verificarJWT } = auth || {};
const { validarCriar, validarPUT, validarPATCH } = validators || {};

function assertFn(name, fn) {
  if (typeof fn !== 'function') {
    // Tornar o erro claro logo ao montar as rotas
    throw new Error(`[ProdutosRouter] Dependência "${name}" é inválida (valor: ${String(fn)}). Verifique export/import.`);
  }
}

// Checagens (se alguma falhar, o Jest/Node vai mostrar exatamente qual está undefined)
assertFn('verificarJWT', verificarJWT);
assertFn('validarCriar', validarCriar);
assertFn('validarPUT', validarPUT);
assertFn('validarPATCH', validarPATCH);
assertFn('ctrl.criar', ctrl?.criar);
assertFn('ctrl.listar', ctrl?.listar);
assertFn('ctrl.buscar', ctrl?.buscar);
assertFn('ctrl.exibir', ctrl?.exibir);
assertFn('ctrl.atualizar', ctrl?.atualizar);
assertFn('ctrl.atualizarParcial', ctrl?.atualizarParcial);
assertFn('ctrl.remover', ctrl?.remover);

// CREATE (201 + Location) — protegida
router.post('/', verificarJWT, validarCriar, ctrl.criar);

// READ (públicas)
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscar, ctrl.exibir);

// UPDATE (protegidas)
router.put('/:id', verificarJWT, ctrl.buscar, validarPUT, ctrl.atualizar);
router.patch('/:id', verificarJWT, ctrl.buscar, validarPATCH, ctrl.atualizarParcial);

// DELETE (protegida)
router.delete('/:id', verificarJWT, ctrl.buscar, ctrl.remover);

module.exports = router;



