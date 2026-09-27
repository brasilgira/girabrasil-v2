const pool = require('../config/db');

// Busca todos os comentários ativos de uma notícia específica.
// `usuarioId` (opcional) é o usuário que está vendo a tela — serve só pra
// calcular se ELE já curtiu cada comentário (curtido_por_mim).
async function listarPorNoticia(noticiaId, usuarioId) {
  const query = `
    SELECT
      c.id,
      c.conteudo,
      c.criado_em,
      c.comentario_pai_id,
      c.usuario_id,
      c.usuario_nome,
      COUNT(cc.id)::int AS curtidas,
      COALESCE(BOOL_OR(cc.usuario_id = $2), false) AS curtido_por_mim
    FROM comentario c
    LEFT JOIN comentario_curtida cc ON cc.comentario_id = c.id
    WHERE c.noticia_id = $1 AND c.ativo = true
    GROUP BY c.id
    ORDER BY c.criado_em ASC
  `;
  const resultado = await pool.query(query, [noticiaId, usuarioId || null]);
  return resultado.rows;
}

// Cria um novo comentário vinculado ao usuário (Supabase Auth) e à notícia.
// Guardamos o nome direto na linha (usuario_nome) porque o "usuário" agora
// vive só no Supabase Auth, não numa tabela local que dá pra fazer JOIN.
async function criar({ conteudo, usuarioId, usuarioNome, noticiaId, comentarioPaiId = null }) {
  const query = `
    INSERT INTO comentario (conteudo, usuario_id, usuario_nome, noticia_id, comentario_pai_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, conteudo, criado_em, usuario_id, usuario_nome, noticia_id, comentario_pai_id
  `;
  const valores = [conteudo, usuarioId, usuarioNome, noticiaId, comentarioPaiId];
  const resultado = await pool.query(query, valores);
  return resultado.rows[0];
}

// Alterna a curtida de um usuário num comentário (like/unlike, tipo toggle).
// Se o usuário já tinha curtido, remove a curtida; se não tinha, adiciona.
// Retorna o novo estado (curtido ou não) e o total atualizado de curtidas.
async function alternarCurtida(comentarioId, usuarioId) {
  const existente = await pool.query(
    'SELECT id FROM comentario_curtida WHERE comentario_id = $1 AND usuario_id = $2',
    [comentarioId, usuarioId]
  );

  const jaCurtia = existente.rows.length > 0;

  if (jaCurtia) {
    await pool.query('DELETE FROM comentario_curtida WHERE id = $1', [existente.rows[0].id]);
  } else {
    await pool.query(
      'INSERT INTO comentario_curtida (comentario_id, usuario_id) VALUES ($1, $2)',
      [comentarioId, usuarioId]
    );
  }

  const contagem = await pool.query(
    'SELECT COUNT(*)::int AS total FROM comentario_curtida WHERE comentario_id = $1',
    [comentarioId]
  );

  return {
    comentarioId: Number(comentarioId),
    curtidoPorMim: !jaCurtia,
    curtidas: contagem.rows[0].total,
  };
}

// Exclui (soft delete) um comentário, mas SÓ se ele pertencer ao usuário
// informado — a condição "AND usuario_id = $2" é o que garante isso no
// próprio banco, além da checagem que o controller já faz. Retorna a
// linha afetada (ou undefined se não existia ou não era do usuário).
async function excluirProprio(comentarioId, usuarioId) {
  const resultado = await pool.query(
    `UPDATE comentario
     SET ativo = false
     WHERE id = $1 AND usuario_id = $2 AND ativo = true
     RETURNING id`,
    [comentarioId, usuarioId]
  );
  return resultado.rows[0];
}

module.exports = { listarPorNoticia, criar, alternarCurtida, excluirProprio };
