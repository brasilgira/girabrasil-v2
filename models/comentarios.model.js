// Esse arquivo só sabe conversar com a tabela "comentario" no banco.

const pool = require('../config/db');

// Busca todos os comentários ativos de uma notícia específica.
// Traz também o nome do usuário que comentou (JOIN com usuario).
async function listarPorNoticia(noticiaId) {
  const resultado = await pool.query(
    `SELECT c.id, c.conteudo, c.criado_em, c.atualizado_em,
            c.comentario_pai_id, u.id AS usuario_id, u.nome AS usuario_nome
     FROM comentario c
     JOIN usuario u ON u.id = c.usuario_id
     WHERE c.noticia_id = $1 AND c.ativo = true
     ORDER BY c.criado_em ASC`,
    [noticiaId]
  );
  return resultado.rows;
}

module.exports = { listarPorNoticia };