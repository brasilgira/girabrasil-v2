// Define quais URLs existem para "noticias".

const express = require('express');
const router = express.Router();
const noticiasController = require('../controllers/noticias.controller');

router.get('/', noticiasController.listarNoticias);
router.get('/:id', noticiasController.buscarNoticia);

module.exports = router;