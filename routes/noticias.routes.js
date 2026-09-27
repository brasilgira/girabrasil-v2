// Define quais URLs existem para "noticias".

const express = require('express');
const router = express.Router();
const noticiasController = require('../controllers/noticias.controller');
const verificarUsuario = require('../middleware/verificarUsuario');

router.get('/', noticiasController.listarNoticias);
router.get('/slug/:slug', noticiasController.buscarNoticiaPorSlug);
router.get('/:id', noticiasController.buscarNoticia);

// Curtir/salvar alteram dado em nome de um usuário — precisam de token
// válido (verificarUsuario), não podem mais confiar num usuarioId vindo
// do corpo da requisição (qualquer um poderia curtir/salvar por outra
// pessoa só trocando o id enviado).
router.post('/:id/curtir', verificarUsuario, noticiasController.curtir);
router.post('/:id/salvar', verificarUsuario, noticiasController.salvar);

module.exports = router;
