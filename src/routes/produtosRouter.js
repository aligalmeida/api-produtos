// src/routes/produtosRouter.js
const express = require('express');
const ctrl = require('../controllers/produtosController');
const { verificarJWT } = require('../middleware/auth');
const {
  validarCriar,
  validarPUT,
  validarPATCH,
} = require('../validators/produtosValidator');

const router = express.Router();

/**
 * Atalho para JSON puro:
 * /api/v1/produtos.json -> sempre responde JSON (útil para browser)
 */
router.get('/.json', ctrl.listar);

// CREATE (201 + Location) — protegida + validação
router.post('/', verificarJWT, validarCriar, ctrl.criar);

// READ (públicas) — agora / responde HTML em browser e JSON em clientes (content negotiation)
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscar, ctrl.exibir);

// UPDATE (protegidas + validação)
router.put('/:id', verificarJWT, ctrl.buscar, validarPUT, ctrl.atualizar);
router.patch('/:id', verificarJWT, ctrl.buscar, validarPATCH, ctrl.atualizarParcial);

// DELETE (protegida + regra de negócio no controller)
router.delete('/:id', verificarJWT, ctrl.buscar, ctrl.remover);

module.exports = router;




