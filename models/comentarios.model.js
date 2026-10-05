const pool = require('../config/db');

// Busca todos os comentários ativos de uma notícia específica.
async function listarPorNoticia(noticiaId, usuarioId) {
  const query = `
    SELECT
      c.id,
      c.conteudo,
      c.criado_em,
      c.comentario_pai_id,
      c.usuario_id,
      COUNT(cc.id)::int AS curtidas,
      COALESCE(BOOL_OR(cc.usuario_id = $2), false) AS curtido_por_mim
    FROM comentario c
    LEFT JOIN comentario_curtida cc ON cc.comentario_id = c.id
    WHERE c.noticia_id = $1 AND c.ativo = true
    GROUP BY c.id
    ORDER BY c.criado_em ASC
  `;

  const resultado = await pool.query(query, [
    noticiaId,
    usuarioId || null
  ]);

  return resultado.rows;
}


// Cria um novo comentário vinculado ao usuário do Supabase Auth.
async function criar({
  conteudo,
  usuarioId,
  usuarioNome,
  noticiaId,
  comentarioPaiId = null
}) {
  const query = `
    INSERT INTO comentario (
      conteudo,
      usuario_id,
      noticia_id,
      comentario_pai_id
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      conteudo,
      criado_em,
      usuario_id,
      noticia_id,
      comentario_pai_id
  `;

  const valores = [
    conteudo,
    usuarioId,
    noticiaId,
    comentarioPaiId
  ];

  const resultado = await pool.query(query, valores);

  return resultado.rows[0];
}

module.exports = { listarPorNoticia, criar, alternarCurtida, excluirProprio };
