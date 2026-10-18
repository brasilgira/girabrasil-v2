// Configuração do Express (rotas, middlewares) — SEM app.listen() aqui.
//
// Por quê separado do server.js? Porque um servidor Express normal
// (app.listen) só funciona em ambientes que mantêm um processo Node
// rodando o tempo todo (nosso PC, Render, Railway, um VPS...). A Vercel
// NÃO funciona assim: ela roda "funções serverless" — pega esse mesmo
// `app` e chama ele diretamente a cada requisição, sem dar listen em
// porta nenhuma. Por isso este arquivo só monta o app e o exporta; quem
// decide se dá listen ou não é quem importa (server.js localmente,
// api/index.js na Vercel).

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// Middleware que permite o Express entender JSON no corpo das requisições.
// IMPORTANTE: precisa vir ANTES de qualquer rota que leia req.body
// (senão req.body chega undefined nas rotas registradas antes dele).
app.use(express.json());

const regioesRoutes = require('./routes/regioes.routes');
const noticiasRoutes = require('./routes/noticias.routes');
const girabotRoutes = require('./routes/girabot.routes');
const comentariosRoutes = require('./routes/comentarios.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const adminRoutes = require('./routes/admin.routes');
const perfilRoutes = require('./routes/perfil.routes');
const rankingRoutes = require('./routes/ranking.routes');

app.use('/api/admin', adminRoutes);
app.use('/api/auth', usuariosRoutes);
app.use('/api/regioes', regioesRoutes);
app.use('/api/noticias', noticiasRoutes);
app.use('/api/girabot', girabotRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/ranking', rankingRoutes);

// Serve os arquivos estáticos do front-end (HTML, CSS, JS puro).
// Na Vercel isso normalmente nem é usado (ela já serve a pasta `public`
// como site estático direto, sem passar pela função), mas mantemos aqui
// pra rodar localmente com "node server.js" continuar funcionando igual.
app.use(express.static(path.join(__dirname, 'public')));

// Rota de teste, só pra confirmar que o servidor está de pé
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', mensagem: 'GiraBrasil API rodando' });
});

module.exports = app;
