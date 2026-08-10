// Recebe a requisição HTTP, chama o model, e devolve a resposta em JSON.

const noticiasModel = require('../models/noticias.model');

async function listarNoticias(req, res) {
  try {
    // O filtro vem via query string, ex: /api/noticias?regiao=3
    const { regiao } = req.query;
    const noticias = await noticiasModel.listarTodas(regiao);
    res.json(noticias);
  } catch (erro) {
    console.error('Erro ao buscar notícias:', erro);
    res.status(500).json({ erro: 'Erro ao buscar notícias' });
  }
}

async function buscarNoticia(req, res) {
  try {
    const { id } = req.params;
    const noticia = await noticiasModel.buscarPorId(id);

    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }

    res.json(noticia);
  } catch (erro) {
    console.error('Erro ao buscar notícia:', erro);
    res.status(500).json({ erro: 'Erro ao buscar notícia' });
  }
}

module.exports = { listarNoticias, buscarNoticia };