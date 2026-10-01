const pool = require('../config/db');

// Dados básicos do perfil (nome, avatar, bio)
async function buscarPorId(usuarioId) {
  const resultado = await pool.query(
    'SELECT id, nome, avatar_url, bio, criado_em FROM perfil WHERE id = $1',
    [usuarioId]
  );
  return resultado.rows[0] || null;
}

// Comentários feitos por esse usuário (pra mostrar no perfil dele),
// já com o título da notícia comentada pra poder linkar de volta.
async function listarComentariosDoUsuario(usuarioId) {
  const resultado = await pool.query(
    `SELECT c.id, c.conteudo, c.criado_em, c.noticia_id, n.titulo AS noticia_titulo, n.regiao_id
     FROM comentario c
     JOIN noticias n ON n.id = c.noticia_id
     WHERE c.usuario_id = $1 AND c.ativo = true
     ORDER BY c.criado_em DESC`,
    [usuarioId]
  );
  return resultado.rows;
}

// Notícias que esse usuário salvou (favoritos)
// `regiao_id` foi incluído (coluna que já existe em `noticias`, nada de
// migration) só pra dar pro perfil calcular "Minha exploração" com dados
// reais, sem inventar número nenhum.
async function listarNoticiasSalvasDoUsuario(usuarioId) {
  const resultado = await pool.query(
    `SELECT n.id, n.titulo, n.resumo, n.imagem_url, n.categoria, n.regiao_id, ns.criado_em AS salvo_em
     FROM noticia_salva ns
     JOIN noticias n ON n.id = ns.noticia_id
     WHERE ns.usuario_id = $1 AND n.ativo = true
     ORDER BY ns.criado_em DESC`,
    [usuarioId]
  );
  return resultado.rows;
}

// Notícias que esse usuário curtiu
async function listarNoticiasCurtidasDoUsuario(usuarioId) {
  const resultado = await pool.query(
    `SELECT n.id, n.titulo, n.resumo, n.imagem_url, n.categoria, n.regiao_id, nc.criado_em AS curtido_em
     FROM noticia_curtida nc
     JOIN noticias n ON n.id = nc.noticia_id
     WHERE nc.usuario_id = $1 AND n.ativo = true
     ORDER BY nc.criado_em DESC`,
    [usuarioId]
  );
  return resultado.rows;
}

// Usado no cadastro/primeiro login, se o gatilho do banco (trigger) não
// tiver criado o perfil ainda por algum motivo — cria ou atualiza o nome.
async function garantirPerfil(usuarioId, nome) {
  const resultado = await pool.query(
    `INSERT INTO perfil (id, nome) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET nome = COALESCE(perfil.nome, EXCLUDED.nome)
     RETURNING id, nome, avatar_url, bio, criado_em`,
    [usuarioId, nome]
  );
  return resultado.rows[0];
}

// Atualiza nome/avatar/bio do próprio usuário (edição de perfil)
async function atualizar(usuarioId, { nome, avatarUrl, bio }) {
  const resultado = await pool.query(
    `UPDATE perfil SET
       nome = COALESCE($2, nome),
       avatar_url = COALESCE($3, avatar_url),
       bio = COALESCE($4, bio)
     WHERE id = $1
     RETURNING id, nome, avatar_url, bio, criado_em`,
    [usuarioId, nome, avatarUrl, bio]
  );
  return resultado.rows[0] || null;
}

module.exports = {
  buscarPorId,
  listarComentariosDoUsuario,
  listarNoticiasSalvasDoUsuario,
  listarNoticiasCurtidasDoUsuario,
  garantirPerfil,
  atualizar,
};
