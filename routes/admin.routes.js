// routes/admin.routes.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const verificarAdmin = require("../middleware/verificarAdmin");

// Toda rota abaixo passa primeiro pelo verificarAdmin — sem exceção.
router.get("/noticias", verificarAdmin, adminController.listarNoticias);
router.post("/noticias", verificarAdmin, adminController.criarNoticia);
router.put("/noticias/:id", verificarAdmin, adminController.editarNoticia);
router.delete("/noticias/:id", verificarAdmin, adminController.apagarNoticia);

router.get("/comentarios", verificarAdmin, adminController.listarComentarios);
router.put("/comentarios/:id", verificarAdmin, adminController.editarComentario);
router.delete("/comentarios/:id", verificarAdmin, adminController.apagarComentario);

router.get("/usuarios", verificarAdmin, adminController.listarUsuarios);
router.delete("/usuarios/:id", verificarAdmin, adminController.excluirAcessoUsuario);
router.get("/metricas", verificarAdmin, adminController.obterMetricas);

module.exports = router;
