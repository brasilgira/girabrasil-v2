// Recebe a requisição HTTP, chama o model, e devolve a resposta em JSON.

const noticiasModel = require('../models/noticias.model');

async function listarNoticias(req, res) {
  try {
    // O filtro vem via query string, ex: /api/noticias?regiao=3
    // ou /api/noticias?geral=true (as 12 notícias gerais, sem região)
    const { regiao, geral } = req.query;
    const noticias = await noticiasModel.listarTodas(regiao, geral === 'true');
    res.json(noticias);
  } catch (erro) {
    console.error('Erro ao buscar notícias:', erro);
    res.status(500).json({ erro: 'Erro ao buscar notícias' });
  }
}

async function buscarNoticiaPorSlug(req, res) {
  try {
    const { slug } = req.params;
    const { usuarioId } = req.query;
    const noticia = await noticiasModel.buscarPorSlug(slug, usuarioId);

    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }

    res.json(noticia);
  } catch (erro) {
    console.error('Erro ao buscar notícia por slug:', erro);
    res.status(500).json({ erro: 'Erro ao buscar notícia' });
  }
}

async function buscarNoticia(req, res) {
  try {
    const { id } = req.params;
    const { usuarioId } = req.query;
    const noticia = await noticiasModel.buscarPorId(id, usuarioId);

    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }

    res.json(noticia);
  } catch (erro) {
    console.error('Erro ao buscar notícia:', erro);
    res.status(500).json({ erro: 'Erro ao buscar notícia' });
  }
}

async function curtir(req, res) {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;
    if (!usuarioId) return res.status(400).json({ erro: 'usuarioId é obrigatório' });

    const resultado = await noticiasModel.alternarCurtida(id, usuarioId);
    res.json(resultado);
  } catch (erro) {
    console.error('Erro ao curtir notícia:', erro);
    res.status(500).json({ erro: 'Erro ao curtir notícia' });
  }
}

async function salvar(req, res) {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;
    if (!usuarioId) return res.status(400).json({ erro: 'usuarioId é obrigatório' });

    const resultado = await noticiasModel.alternarSalvar(id, usuarioId);
    res.json(resultado);
  } catch (erro) {
    console.error('Erro ao salvar notícia:', erro);
    res.status(500).json({ erro: 'Erro ao salvar notícia' });
  }
}

module.exports = { listarNoticias, buscarNoticia, buscarNoticiaPorSlug, curtir, salvar };
