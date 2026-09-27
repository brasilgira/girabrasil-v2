const comentariosModel = require('../models/comentarios.model');

// Lista todos os comentários de uma notícia específica
async function listarPorNoticia(req, res) {
  try {
    const { noticiaId } = req.params;
    const { usuarioId } = req.query; // quem está olhando a tela (opcional)
    const comentarios = await comentariosModel.listarPorNoticia(noticiaId, usuarioId);
    return res.json(comentarios);
  } catch (erro) {
    console.error('Erro ao buscar comentários:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar comentários' });
  }
}

// Salva um novo comentário
async function criar(req, res) {
  try {
    const { conteudo, noticiaId, comentarioPaiId } = req.body;

    // O autor é sempre quem está autenticado (req.usuarioLogado, populado
    // pelo verificarUsuario a partir do token) — nunca o usuarioId/usuarioNome
    // que o corpo da requisição mandar, pra ninguém conseguir comentar se
    // passando por outra pessoa.
    const usuarioId = req.usuarioLogado.id;
    const usuarioNome =
      req.usuarioLogado.user_metadata?.nome ||
      req.usuarioLogado.user_metadata?.display_name ||
      req.usuarioLogado.email ||
      'Usuário';

    // Validação básica dos campos obrigatórios
    if (!conteudo || !conteudo.trim() || !noticiaId) {
      return res.status(400).json({
        erro: 'Campos obrigatórios ausentes: conteudo e noticiaId'
      });
    }

    const novoComentario = await comentariosModel.criar({
      conteudo: conteudo.trim(),
      usuarioId,
      usuarioNome,
      noticiaId,
      comentarioPaiId
    });

    // Já devolve no mesmo formato da listagem (com curtidas zeradas),
    // pra dar pra jogar direto na lista no front sem precisar recarregar.
    return res.status(201).json({
      ...novoComentario,
      curtidas: 0,
      curtido_por_mim: false,
    });
  } catch (erro) {
    console.error('Erro ao criar comentário:', erro);
    return res.status(500).json({ erro: 'Erro ao salvar comentário' });
  }
}

// Curte ou descurte um comentário (toggle) em nome do usuário autenticado
async function curtir(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuarioLogado.id;

    const resultado = await comentariosModel.alternarCurtida(id, usuarioId);
    return res.json(resultado);
  } catch (erro) {
    console.error('Erro ao curtir comentário:', erro);
    return res.status(500).json({ erro: 'Erro ao curtir comentário' });
  }
}

// Exclui (soft delete) um comentário — só o próprio autor pode excluir.
// A checagem de propriedade é feita no model (WHERE usuario_id = $2), então
// aqui só precisamos checar se algo foi realmente afetado.
async function excluir(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuarioLogado.id;

    const excluido = await comentariosModel.excluirProprio(id, usuarioId);

    if (!excluido) {
      // Ou o comentário não existe, ou não pertence a este usuário — nos
      // dois casos a resposta certa pro cliente é "não encontrado"/"sem
      // permissão", sem dar dica de qual dos dois é (evita enumeração).
      return res.status(404).json({ erro: 'Comentário não encontrado ou você não tem permissão para excluí-lo.' });
    }

    return res.status(200).json({ mensagem: 'Comentário excluído com sucesso.' });
  } catch (erro) {
    console.error('Erro ao excluir comentário:', erro);
    return res.status(500).json({ erro: 'Erro ao excluir comentário.' });
  }
}

module.exports = { listarPorNoticia, criar, curtir, excluir };
