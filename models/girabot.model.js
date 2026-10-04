// models/girabot.model.js
//
// Toda consulta aqui recebe usuarioId (vindo de req.usuarioLogado.id, nunca
// do corpo da requisição) e filtra por ele — isso é o que garante que um
// usuário nunca enxerga/altera conversa de outro, mesmo adivinhando um id.
const pool = require("../config/db");

async function listarConversas(usuarioId) {
  const resultado = await pool.query(
    `SELECT id, titulo, criado_em, atualizado_em
     FROM girabot_conversa
     WHERE usuario_id = $1
     ORDER BY atualizado_em DESC`,
    [usuarioId]
  );
  return resultado.rows;
}

async function criarConversa(usuarioId) {
  const resultado = await pool.query(
    `INSERT INTO girabot_conversa (usuario_id) VALUES ($1)
     RETURNING id, titulo, criado_em, atualizado_em`,
    [usuarioId]
  );
  return resultado.rows[0];
}

// Retorna null se a conversa não existe OU não é do usuário — o controller
// trata os dois casos exatamente igual (404), pra não revelar a quem não é
// dono se aquele id existe.
async function obterConversaDoDono(conversaId, usuarioId) {
  const resultado = await pool.query(
    `SELECT id, titulo, criado_em, atualizado_em FROM girabot_conversa
     WHERE id = $1 AND usuario_id = $2`,
    [conversaId, usuarioId]
  );
  return resultado.rows[0] || null;
}

async function listarMensagens(conversaId) {
  const resultado = await pool.query(
    `SELECT id, papel, conteudo, ordem, criado_em
     FROM girabot_mensagem
     WHERE conversa_id = $1
     ORDER BY ordem ASC`,
    [conversaId]
  );
  return resultado.rows;
}

// Usa uma transação: calcula a próxima "ordem" e insere, sem risco de duas
// mensagens da mesma conversa caírem com a mesma ordem em uma corrida rara.
async function inserirMensagem(conversaId, papel, conteudo) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    // FOR UPDATE não pode ir junto de função agregada (MAX), então a trava
    // é na linha da própria conversa (serializa quem está inserindo
    // mensagem nela ao mesmo tempo); o MAX roda depois, sem agregado+lock.
    await cliente.query(`SELECT id FROM girabot_conversa WHERE id = $1 FOR UPDATE`, [conversaId]);
    const { rows } = await cliente.query(
      `SELECT COALESCE(MAX(ordem), 0) + 1 AS proxima FROM girabot_mensagem WHERE conversa_id = $1`,
      [conversaId]
    );
    const proximaOrdem = rows[0].proxima;
    const inserida = await cliente.query(
      `INSERT INTO girabot_mensagem (conversa_id, papel, conteudo, ordem)
       VALUES ($1, $2, $3, $4)
       RETURNING id, papel, conteudo, ordem, criado_em`,
      [conversaId, papel, conteudo, proximaOrdem]
    );
    await cliente.query(
      `UPDATE girabot_conversa SET atualizado_em = now() WHERE id = $1`,
      [conversaId]
    );
    await cliente.query("COMMIT");
    return inserida.rows[0];
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
}

async function definirTitulo(conversaId, titulo) {
  await pool.query(
    `UPDATE girabot_conversa SET titulo = $2 WHERE id = $1`,
    [conversaId, titulo]
  );
}

async function renomearConversaDoDono(conversaId, usuarioId, titulo) {
  const resultado = await pool.query(
    `UPDATE girabot_conversa SET titulo = $3, atualizado_em = now()
     WHERE id = $1 AND usuario_id = $2
     RETURNING id, titulo, criado_em, atualizado_em`,
    [conversaId, usuarioId, titulo]
  );
  return resultado.rows[0] || null;
}

async function excluirConversaDoDono(conversaId, usuarioId) {
  const resultado = await pool.query(
    `DELETE FROM girabot_conversa WHERE id = $1 AND usuario_id = $2 RETURNING id`,
    [conversaId, usuarioId]
  );
  return resultado.rows[0] || null;
}

module.exports = {
  listarConversas,
  criarConversa,
  obterConversaDoDono,
  listarMensagens,
  inserirMensagem,
  definirTitulo,
  renomearConversaDoDono,
  excluirConversaDoDono,
};
