// Define quais URLs existem para "noticias".

const express = require('express');
const router = express.Router();
const noticiasController = require('../controllers/noticias.controller');

router.get('/', noticiasController.listarNoticias);
router.get('/slug/:slug', noticiasController.buscarNoticiaPorSlug);
router.get('/:id', noticiasController.buscarNoticia);
router.post('/:id/curtir', noticiasController.curtir);
router.post('/:id/salvar', noticiasController.salvar);

module.exports = router;
