// Ponto de entrada da aplicação.
// Aqui só inicializamos o Express e conectamos as peças (rotas, middlewares).
// A lógica de verdade fica nos controllers/models, não aqui.

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const regioesRoutes = require('./routes/regioes.routes');
const noticiasRoutes = require('./routes/noticias.routes');
const comentariosRoutes = require('./routes/comentarios.routes');
const girabotRoutes = require('./routes/girabot.routes');
app.use('/api/girabot', girabotRoutes);

app.use('/api/regioes', regioesRoutes);

// Middleware que permite o Express entender JSON no corpo das requisições
app.use(express.json());

// Serve os arquivos estáticos do front-end (HTML, CSS, JS puro)
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/noticias', noticiasRoutes);
app.use('/api/comentarios', comentariosRoutes);

// Rota de teste, só pra confirmar que o servidor está de pé
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', mensagem: 'GiraBrasil API rodando' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});