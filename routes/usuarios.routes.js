const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuario.controller');
const cadastroController = require('../controllers/cadastro.controller');

// OBS: esta rota POST /cadastro é do sistema antigo (tabela `usuario`
// local, senha própria) e não é mais chamada pelo frontend — o cadastro
// real hoje é 100% via Supabase Auth (ver public/js/auth.js). Mantida
// aqui sem alteração, fora do escopo desta tarefa.
router.post('/cadastro', usuariosController.cadastrar);

// GET /api/auth/nome-disponivel?nome=... — checagem usada pelo cadastro
// novo (Supabase Auth) antes de chamar supabaseClient.auth.signUp().
router.get('/nome-disponivel', cadastroController.verificarNome);

module.exports = router;