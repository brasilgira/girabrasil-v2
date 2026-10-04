const express = require('express');
const router = express.Router();
const girabotController = require('../controllers/girabot.controller');
const verificarUsuario = require('../middleware/verificarUsuario');

// Todo o histórico do GiraBot é por conta — exige login em tudo.
router.use(verificarUsuario);

router.get('/conversas', girabotController.listarConversas);
router.post('/conversas', girabotController.criarConversa);
router.get('/conversas/:id/mensagens', girabotController.listarMensagens);
router.post('/conversas/:id/mensagens', girabotController.enviarMensagem);
router.patch('/conversas/:id', girabotController.renomearConversa);
router.delete('/conversas/:id', girabotController.excluirConversa);

module.exports = router;
