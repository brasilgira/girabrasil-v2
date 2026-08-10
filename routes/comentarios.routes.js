// Define quais URLs existem para "comentarios".

const express = require('express');
const router = express.Router();
const comentariosController = require('../controllers/comentarios.controller');

// Comentários sempre pertencem a uma notícia, então a rota já nasce aninhada
router.get('/noticia/:noticiaId', comentariosController.listarComentarios);

module.exports = router;