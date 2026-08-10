// Recebe a requisição, chama o model, e organiza os comentários em formato de árvore
// (comentário raiz + suas respostas aninhadas) antes de devolver ao front-end.

const comentariosModel = require('../models/comentarios.model');

// Transforma a lista "achatada" de comentários numa árvore de respostas
function organizarEmArvore(comentarios) {
  const mapa = {};
  const raizes = [];

  // Primeiro, cria um "balde" pra cada comentário, já com uma lista vazia de respostas
  comentarios.forEach((comentario) => {
    mapa[comentario.id] = { ...comentario, respostas: [] };
  });

  // Depois, decide onde cada comentário se encaixa: raiz ou resposta de outro
  comentarios.forEach((comentario) => {
    if (comentario.comentario_pai_id) {
      // É uma resposta: encaixa dentro do "balde" do comentário pai
      const pai = mapa[comentario.comentario_pai_id];
      if (pai) {
        pai.respostas.push(mapa[comentario.id]);
      }
    } else {
      // Não tem pai: é um comentário raiz
      raizes.push(mapa[comentario.id]);
    }
  });

  return raizes;
}

async function listarComentarios(req, res) {
  try {
    const { noticiaId } = req.params;
    const comentarios = await comentariosModel.listarPorNoticia(noticiaId);
    const arvore = organizarEmArvore(comentarios);
    res.json(arvore);
  } catch (erro) {
    console.error('Erro ao buscar comentários:', erro);
    res.status(500).json({ erro: 'Erro ao buscar comentários' });
  }
}

module.exports = { listarComentarios };