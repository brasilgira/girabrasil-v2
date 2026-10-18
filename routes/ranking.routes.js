const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking.controller');
const verificarUsuario = require('../middleware/verificarUsuario');

// GET /api/ranking/destaques -> 1º colocado de cada jogo (público)
// (precisa vir ANTES de /:jogo, senão "destaques" seria lido como nome de jogo)
router.get('/destaques', rankingController.obterDestaques);

// POST /api/ranking/partidas -> começa uma partida (logado; o servidor anota a hora)
router.post('/partidas', verificarUsuario, rankingController.iniciarPartida);

// POST /api/ranking/partidas/:id/pontuacao -> envia o resultado da partida (logado)
router.post('/partidas/:id/pontuacao', verificarUsuario, rankingController.enviarPontuacao);

// GET /api/ranking/:jogo/meu -> posição e pontuação de quem está logado
router.get('/:jogo/meu', verificarUsuario, rankingController.obterMeuDesempenho);

// GET /api/ranking/:jogo -> classificação do jogo (sapo | onca | mico), público
router.get('/:jogo', rankingController.obterClassificacao);

module.exports = router;
