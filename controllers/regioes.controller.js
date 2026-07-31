// Recebe a requisição HTTP, chama o model, e devolve a resposta em JSON.
// Não tem SQL aqui, só lógica de "o que fazer com o pedido".

const regioesModel = require('../models/regioes.model');

async function listarRegioes(req, res) {
  try {
    const regioes = await regioesModel.listarTodas();
    res.json(regioes);
  } catch (erro) {
    console.error('Erro ao buscar regiões:', erro);
    res.status(500).json({ erro: 'Erro ao buscar regiões' });
  }
}

module.exports = { listarRegioes };