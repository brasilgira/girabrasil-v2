const pool = require('../config/db');

// Busca todas as notícias ativas, com JOIN na região (autor é opcional
// agora — uma notícia de admin pode não ter um "usuario_id" formal).
//
// `regiaoId` filtra pra notícias de UMA região específica (as 60
// regionais). `apenasGerais` filtra pras 12 notícias gerais (regiao_id
// nulo) — os dois filtros são mutuamente exclusivos na prática, mas
// nada impede o model de aceitar os dois parâmetros.
async function listarTodas(regiaoId, apenasGerais) {
  let query = `
    SELECT n.id, n.titulo, n.resumo, n.conteudo, n.imagem_url, n.categoria,
           n.bioma, n.link_fonte, n.slug_origem, n.corpo_json, n.metadados,
           n.criado_em, n.atualizado_em,
           r.id AS regiao_id, r.nome AS regiao_nome
    FROM noticias n
    LEFT JOIN regiao r ON r.id = n.regiao_id
    WHERE n.ativo = true
  `;
  const valores = [];

  if (regiaoId) {
    valores.push(regiaoId);
    query += ` AND n.regiao_id = $${valores.length}`;
  }

  if (apenasGerais) {
    query += ` AND n.regiao_id IS NULL`;
  }

  query += ' ORDER BY n.criado_em DESC';

  const resultado = await pool.query(query, valores);
  return resultado.rows;
}

// Busca uma única notícia pelo ID. `usuarioId` (opcional) é quem está
// vendo a tela, só pra calcular se ELE já curtiu/salvou essa notícia.
async function buscarPorId(id, usuarioId) {
  const resultado = await pool.query(
    `SELECT n.id, n.titulo, n.resumo, n.conteudo, n.imagem_url, n.categoria,
            n.bioma, n.link_fonte, n.slug_origem, n.corpo_json, n.metadados,
            n.criado_em, n.atualizado_em,
            r.id AS regiao_id, r.nome AS regiao_nome,
            COUNT(DISTINCT nc.id)::int AS curtidas,
            COALESCE(BOOL_OR(nc.usuario_id = $2), false) AS curtido_por_mim,
            COALESCE(BOOL_OR(ns.usuario_id = $2), false) AS salvo_por_mim
     FROM noticias n
     LEFT JOIN regiao r ON r.id = n.regiao_id
     LEFT JOIN noticia_curtida nc ON nc.noticia_id = n.id
     LEFT JOIN noticia_salva ns ON ns.noticia_id = n.id AND ns.usuario_id = $2
     WHERE n.id = $1 AND n.ativo = true
     GROUP BY n.id, r.id`,
    [id, usuarioId || null]
  );
  return resultado.rows[0];
}

// Igual a buscarPorId, mas pelo slug_origem (ex: 'geral-1',
// 'regiao-norte-03') em vez do id numérico — útil como identificador
// estável, já que o id numérico é gerado pelo banco.
async function buscarPorSlug(slugOrigem, usuarioId) {
  const resultado = await pool.query(
    `SELECT n.id, n.titulo, n.resumo, n.conteudo, n.imagem_url, n.categoria,
            n.bioma, n.link_fonte, n.slug_origem, n.corpo_json, n.metadados,
            n.criado_em, n.atualizado_em,
            r.id AS regiao_id, r.nome AS regiao_nome,
            COUNT(DISTINCT nc.id)::int AS curtidas,
            COALESCE(BOOL_OR(nc.usuario_id = $2), false) AS curtido_por_mim,
            COALESCE(BOOL_OR(ns.usuario_id = $2), false) AS salvo_por_mim
     FROM noticias n
     LEFT JOIN regiao r ON r.id = n.regiao_id
     LEFT JOIN noticia_curtida nc ON nc.noticia_id = n.id
     LEFT JOIN noticia_salva ns ON ns.noticia_id = n.id AND ns.usuario_id = $2
     WHERE n.slug_origem = $1 AND n.ativo = true
     GROUP BY n.id, r.id`,
    [slugOrigem, usuarioId || null]
  );
  return resultado.rows[0];
}

// Cria uma notícia nova (usado pelo painel de admin)
async function criar({ titulo, resumo, conteudo, imagemUrl, categoria, linkFonte, regiaoId, usuarioId }) {
  const resultado = await pool.query(
    `INSERT INTO noticias (titulo, resumo, conteudo, imagem_url, categoria, link_fonte, regiao_id, usuario_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [titulo, resumo, conteudo, imagemUrl, categoria, linkFonte, regiaoId || null, usuarioId || null]
  );
  return resultado.rows[0];
}

// Alterna curtida numa notícia (like/unlike, tipo toggle) — igual já
// funciona pra comentário, só que na notícia inteira agora.
async function alternarCurtida(noticiaId, usuarioId) {
  const existente = await pool.query(
    'SELECT id FROM noticia_curtida WHERE noticia_id = $1 AND usuario_id = $2',
    [noticiaId, usuarioId]
  );
  const jaCurtia = existente.rows.length > 0;

  if (jaCurtia) {
    await pool.query('DELETE FROM noticia_curtida WHERE id = $1', [existente.rows[0].id]);
  } else {
    await pool.query(
      'INSERT INTO noticia_curtida (noticia_id, usuario_id) VALUES ($1, $2)',
      [noticiaId, usuarioId]
    );
  }

  const contagem = await pool.query(
    'SELECT COUNT(*)::int AS total FROM noticia_curtida WHERE noticia_id = $1',
    [noticiaId]
  );

  return { noticiaId: Number(noticiaId), curtidoPorMim: !jaCurtia, curtidas: contagem.rows[0].total };
}

// Alterna "salvar" numa notícia (favoritos, aparece no perfil)
async function alternarSalvar(noticiaId, usuarioId) {
  const existente = await pool.query(
    'SELECT id FROM noticia_salva WHERE noticia_id = $1 AND usuario_id = $2',
    [noticiaId, usuarioId]
  );
  const jaSalvou = existente.rows.length > 0;

  if (jaSalvou) {
    await pool.query('DELETE FROM noticia_salva WHERE id = $1', [existente.rows[0].id]);
  } else {
    await pool.query(
      'INSERT INTO noticia_salva (noticia_id, usuario_id) VALUES ($1, $2)',
      [noticiaId, usuarioId]
    );
  }

  return { noticiaId: Number(noticiaId), salvoPorMim: !jaSalvou };
}

module.exports = { listarTodas, buscarPorId, buscarPorSlug, criar, alternarCurtida, alternarSalvar };
