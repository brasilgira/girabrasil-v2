const perfilModel = require('../models/perfil.model');
const obterClienteSupabaseAdmin = require('../config/supabaseAdmin');

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

    // `perfil.criado_em` é a data em que a LINHA da tabela `perfil` foi
    // criada — normalmente igual à criação da conta (o trigger do Supabase
    // cria essa linha logo no signup), mas pode ficar atrasada em relação
    // à conta real se, por algum motivo, essa linha só tiver sido criada
    // depois (ex: fallback de garantirPerfil rodando depois do signup).
    // A fonte da verdade de "quando a conta foi criada" é sempre
    // auth.users.created_at no Supabase Auth — buscamos ela aqui pra
    // "Membro desde" e pro nível usarem a data certa. Se essa consulta
    // falhar por qualquer motivo, caímos de volta em perfil.criado_em em
    // vez de quebrar a resposta inteira.
    let criadoEmConta = perfil.criado_em;
    let isAdmin = false;
    try {
      const clienteAdmin = obterClienteSupabaseAdmin();
      const { data, error } = await clienteAdmin.auth.admin.getUserById(id);
      if (!error && data?.user) {
        criadoEmConta = data.user.created_at || criadoEmConta;
        isAdmin = data.user.app_metadata?.is_admin === true;
      }
    } catch (erroSupabase) {
      console.error('Erro ao buscar dados da conta no Supabase Auth (perfil):', erroSupabase.message);
    }

    return res.json({
      ...perfil,
      criadoEmConta,
      isAdmin,
      comentarios,
      noticiasSalvas: salvas,
      noticiasCurtidas: curtidas,
    });
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
