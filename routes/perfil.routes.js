const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfil.controller');
const verificarUsuario = require('../middleware/verificarUsuario');

// GET /api/perfil/:id -> perfil público (dados + comentários + salvos + curtidos)
router.get('/:id', perfilController.buscarPerfil);

// PUT /api/perfil/:id -> editar o próprio perfil (precisa estar logado E
// só pode editar o PRÓPRIO id — verificarUsuario + checagem no controller)
router.put('/:id', verificarUsuario, perfilController.atualizarPerfil);

module.exports = router;
