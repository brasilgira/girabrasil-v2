const express = require('express');
const router = express.Router();
const comentariosController = require('../controllers/comentarios.controller');
const verificarUsuario = require('../middleware/verificarUsuario');

// GET /api/comentarios/noticia/:noticiaId -> Busca os comentários de uma notícia
// (rota pública — precisa poder ser vista por quem não está logado também)
router.get('/noticia/:noticiaId', comentariosController.listarPorNoticia);

// POST /api/comentarios -> Salva um comentário novo (precisa de login: o
// autor do comentário é sempre req.usuarioLogado, nunca o usuarioId do body)
router.post('/', verificarUsuario, comentariosController.criar);

// POST /api/comentarios/:id/curtir -> Curte/descurte um comentário (toggle)
router.post('/:id/curtir', verificarUsuario, comentariosController.curtir);

// DELETE /api/comentarios/:id -> Exclui (soft delete) um comentário —
// só o próprio autor consegue excluir o próprio comentário.
router.delete('/:id', verificarUsuario, comentariosController.excluir);

module.exports = router;
