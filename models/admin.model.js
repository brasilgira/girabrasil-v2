// models/admin.model.js
//
// SQL das ações administrativas. Segue o schema real (usuario, regiao,
// noticias, comentario — sem tabela administrador separada) e a regra de
// sempre usar soft delete (ativo = false), nunca DELETE FROM de verdade.
const pool = require("../config/db");

// ---------- Notícias ----------

async function listarNoticias() {
  const resultado = await pool.query(
    `SELECT n.*, p.nome AS autor_nome, r.nome AS regiao_nome
     FROM noticias n
     LEFT JOIN perfil p ON p.id = n.usuario_id
     LEFT JOIN regiao r ON r.id = n.regiao_id
     WHERE n.ativo = true
     ORDER BY n.criado_em DESC`
  );
  return resultado.rows;
}

async function criarNoticia({ titulo, resumo, conteudo, imagemUrl, categoria, bioma, linkFonte, regiaoId, corpoJson, criadoEm, usuarioId }) {
  const resultado = await pool.query(
    `INSERT INTO noticias (titulo, resumo, conteudo, imagem_url, categoria, bioma, link_fonte, regiao_id, corpo_json, usuario_id, criado_em)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, now()))
     RETURNING *`,
    [
      titulo,
      resumo,
      conteudo,
      imagemUrl,
      categoria,
      bioma,
      linkFonte,
      regiaoId || null,
      corpoJson ? JSON.stringify(corpoJson) : null,
      usuarioId || null,
      criadoEm || null,
    ]
  );
  return resultado.rows[0];
}

async function editarNoticia(id, { titulo, resumo, conteudo, imagemUrl, categoria, bioma, linkFonte, regiaoId, corpoJson, criadoEm }) {
  // OBS: corpo_json NÃO usa COALESCE — o admin precisa conseguir limpar o
  // conteúdo estruturado de propósito (mandando null), então o valor que
  // vier do formulário sempre substitui o que já estava salvo.
  const resultado = await pool.query(
    `UPDATE noticias SET
       titulo = $1,
       resumo = COALESCE($2, resumo),
       conteudo = $3,
       imagem_url = COALESCE($4, imagem_url),
       categoria = COALESCE($5, categoria),
       bioma = COALESCE($6, bioma),
       link_fonte = COALESCE($7, link_fonte),
       regiao_id = COALESCE($8, regiao_id),
       corpo_json = $9,
       criado_em = COALESCE($10, criado_em),
       atualizado_em = now()
     WHERE id = $11
     RETURNING *`,
    [
      titulo,
      resumo,
      conteudo,
      imagemUrl,
      categoria,
      bioma,
      linkFonte,
      regiaoId,
      corpoJson ? JSON.stringify(corpoJson) : null,
      criadoEm || null,
      id,
    ]
  );
  return resultado.rows[0] || null;
}

async function apagarNoticia(id) {
  const resultado = await pool.query(
    `UPDATE noticias SET ativo = false WHERE id = $1 RETURNING id, ativo`,
    [id]
  );
  return resultado.rows[0] || null;
}

// ---------- Comentários ----------

async function listarComentarios() {
  // OBS: o autor do comentário agora vem direto de c.usuario_nome (o login
  // é feito via Supabase Auth, então não dá mais pra confiar num JOIN com
  // a tabela `usuario` local — nem todo usuário logado existe lá).
  const resultado = await pool.query(
    `SELECT c.*, c.usuario_nome AS autor_nome, n.titulo AS noticia_titulo
     FROM comentario c
     LEFT JOIN noticias n ON n.id = c.noticia_id
     WHERE c.ativo = true
     ORDER BY c.criado_em DESC`
  );
  return resultado.rows;
}

async function editarComentario(id, texto) {
  // OBS: a coluna real na tabela é `conteudo` (não `texto` — esse era um
  // bug antigo aqui que fazia essa query falhar).
  const resultado = await pool.query(
    `UPDATE comentario SET conteudo = $1 WHERE id = $2 RETURNING *`,
    [texto, id]
  );
  return resultado.rows[0] || null;
}

async function apagarComentario(id) {
  const resultado = await pool.query(
    `UPDATE comentario SET ativo = false WHERE id = $1 RETURNING id, ativo`,
    [id]
  );
  return resultado.rows[0] || null;
}

// ---------- Usuários ----------
// Só o que a Fase 4 pede: consulta, sem e-mail e sem desativação (não há
// coluna `ativo` em `perfil`, e não vamos criar uma nesta fase).
// Recebe os ids de quem AINDA tem conta ativa no Supabase Auth (o
// controller busca isso via auth.admin.listUsers() antes de chamar aqui) e
// devolve os dados de perfil só dessas pessoas. É assim — e não com uma
// coluna nova em `perfil` — que uma conta cujo acesso foi removido some da
// lista: a linha de perfil continua existindo no banco (decisão explícita,
// ver controllers/admin.controller.js), só não aparece mais aqui porque o
// id dela não está mais entre os ids informados.
async function listarUsuariosPorIds(ids) {
  if (!ids.length) return [];
  const resultado = await pool.query(
    `SELECT id, nome, avatar_url, criado_em FROM perfil WHERE id = ANY($1::uuid[]) ORDER BY criado_em DESC`,
    [ids]
  );
  return resultado.rows;
}

// ---------- Métricas ----------

async function obterTotais() {
  const resultado = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM perfil) AS usuarios,
       (SELECT count(*)::int FROM noticias WHERE ativo = true) AS noticias,
       (SELECT count(*)::int FROM comentario WHERE ativo = true) AS comentarios`
  );
  return resultado.rows[0];
}

// Cadastros por mês (perfil.criado_em), últimos 12 meses — meses sem
// nenhum cadastro não aparecem na consulta, então o controller preenche
// os buracos com 0 antes de devolver pro front.
async function obterCadastrosPorMes() {
  const resultado = await pool.query(
    `SELECT to_char(date_trunc('month', criado_em), 'YYYY-MM') AS mes, count(*)::int AS total
     FROM perfil
     WHERE criado_em >= date_trunc('month', now()) - interval '11 months'
     GROUP BY 1
     ORDER BY 1`
  );
  return resultado.rows;
}

module.exports = {
  listarNoticias,
  criarNoticia,
  editarNoticia,
  apagarNoticia,
  listarComentarios,
  editarComentario,
  apagarComentario,
  listarUsuariosPorIds,
  obterTotais,
  obterCadastrosPorMes,
};
