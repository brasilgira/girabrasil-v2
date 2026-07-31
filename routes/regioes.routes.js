// Define quais URLs existem para "regiao".
// Nenhuma lógica aqui, só encaminha pro controller certo.

const express = require('express');
const router = express.Router();
const regioesController = require('../controllers/regioes.controller');

router.get('/', regioesController.listarRegioes);

module.exports = router;