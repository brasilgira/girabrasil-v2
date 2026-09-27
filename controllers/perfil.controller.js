const perfilModel = require('../models/perfil.model');

// GET /api/perfil/:id — perfil público de qualquer usuário (é isso que
// abre quando alguém clica no nome de quem comentou)
async function buscarPerfil(req, res) {
  try {
    const { id } = req.params;

    const perfil = await perfilModel.buscarPorId(id);
    if (!perfil) {
      return res.status(404).json({ erro: 'Perfil não encontrado.' });
    }

    const [comentarios, salvas, curtidas] = await Promise.all([
      perfilModel.listarComentariosDoUsuario(id),
      perfilModel.listarNoticiasSalvasDoUsuario(id),
      perfilModel.listarNoticiasCurtidasDoUsuario(id),
    ]);

    return res.json({ ...perfil, comentarios, noticiasSalvas: salvas, noticiasCurtidas: curtidas });
  } catch (erro) {
    console.error('Erro ao buscar perfil:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar perfil.' });
  }
}

// PUT /api/perfil/:id — edição do próprio perfil (nome/avatar/bio).
// Protegida por verificarUsuario (token do Supabase); aqui só falta
// confirmar que o :id da URL é o mesmo id de quem está autenticado —
// sem isso, um usuário logado conseguiria editar o perfil de outra pessoa
// só trocando o id na URL.
async function atualizarPerfil(req, res) {
  try {
    const { id } = req.params;
    const { nome, avatarUrl, bio } = req.body;

    if (req.usuarioLogado.id !== id) {
      return res.status(403).json({ erro: 'Você só pode editar o seu próprio perfil.' });
    }

    const perfilAtualizado = await perfilModel.atualizar(id, { nome, avatarUrl, bio });
    if (!perfilAtualizado) {
      return res.status(404).json({ erro: 'Perfil não encontrado.' });
    }

    return res.json(perfilAtualizado);
  } catch (erro) {
    console.error('Erro ao atualizar perfil:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
  }
}

module.exports = { buscarPerfil, atualizarPerfil };
