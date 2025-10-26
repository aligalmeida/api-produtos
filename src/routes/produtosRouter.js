const express = require('express');
const ctrl = require('../controllers/produtosController');
const { verificarJWT } = require('../middleware/auth');

const router = express.Router();

// CREATE (protegida)
router.post('/produtos', verificarJWT, ctrl.criar);

// READ (públicas)
router.get('/produtos', ctrl.listar);
router.get('/produtos/:id', ctrl.buscar, ctrl.exibir);

// UPDATE (protegidas)
router.put('/produtos/:id', verificarJWT, ctrl.buscar, ctrl.atualizar);
router.patch('/produtos/:id', verificarJWT, ctrl.buscar, ctrl.atualizarParcial);

// DELETE (protegida)
router.delete('/produtos/:id', verificarJWT, ctrl.buscar, ctrl.remover);

module.exports = router;
