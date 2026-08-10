// Esse arquivo só sabe conversar com a tabela "noticias" no banco.
// Nenhuma outra parte do projeto deve escrever SQL fora daqui.

const pool = require('../config/db');

// Busca todas as notícias ativas, opcionalmente filtradas por região.
// Já traz o nome da região junto (JOIN), pra não precisar de uma segunda consulta no front.
async function listarTodas(regiaoId) {
  let query = `
    SELECT n.id, n.titulo, n.conteudo, n.criado_em, n.atualizado_em,
           r.id AS regiao_id, r.nome AS regiao_nome
    FROM noticias n
    JOIN regiao r ON r.id = n.regiao_id
    WHERE n.ativo = true
  `;
  const valores = [];

  // Se veio um filtro de região, adiciona a condição na query
  if (regiaoId) {
    valores.push(regiaoId);
    query += ` AND n.regiao_id = $${valores.length}`;
  }

  query += ' ORDER BY n.criado_em DESC';

  const resultado = await pool.query(query, valores);
  return resultado.rows;
}

// Busca uma única notícia pelo id
async function buscarPorId(id) {
  const resultado = await pool.query(
    `SELECT n.id, n.titulo, n.conteudo, n.criado_em, n.atualizado_em,
            r.id AS regiao_id, r.nome AS regiao_nome
     FROM noticias n
     JOIN regiao r ON r.id = n.regiao_id
     WHERE n.id = $1 AND n.ativo = true`,
    [id]
  );
  return resultado.rows[0]; // undefined se não achar
}

module.exports = { listarTodas, buscarPorId };