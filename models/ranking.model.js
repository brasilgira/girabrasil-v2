// models/ranking.model.js
//
// Acesso ao banco para o ranking dos jogos. Toda consulta que mexe em dados de
// um jogador recebe usuarioId vindo de req.usuarioLogado.id (token do Supabase),
// nunca do corpo da requisição.
const pool = require('../config/db');

// Cria uma partida e devolve o id dela. A hora de início é a do SERVIDOR
// (default now() do banco) — o cliente não consegue mexer nela.
async function criarPartida(usuarioId, jogo) {
  const resultado = await pool.query(
    `INSERT INTO jogo_partida (usuario_id, jogo) VALUES ($1, $2) RETURNING id`,
    [usuarioId, jogo]
  );
  return resultado.rows[0].id;
}

// Quantas partidas o usuário iniciou no último minuto (limite contra abuso).
async function contarPartidasUltimoMinuto(usuarioId) {
  const resultado = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM jogo_partida
     WHERE usuario_id = $1 AND iniciada_em > now() - interval '1 minute'`,
    [usuarioId]
  );
  return resultado.rows[0].total;
}

// Só devolve a partida se ela for DESTE usuário (mesma resposta para "não
// existe" e "é de outra pessoa", para não revelar ids alheios).
// Já traz os segundos decorridos calculados pelo próprio banco.
async function obterPartidaDoDono(partidaId, usuarioId) {
  const resultado = await pool.query(
    `SELECT id, jogo, pontuacao, envios, finalizada_em,
            EXTRACT(EPOCH FROM (now() - iniciada_em))::float8 AS segundos
     FROM jogo_partida
     WHERE id = $1 AND usuario_id = $2`,
    [partidaId, usuarioId]
  );
  return resultado.rows[0] || null;
}

// Registra o envio na partida. A pontuação da partida nunca diminui.
async function registrarEnvioNaPartida(partidaId, pontuacao) {
  await pool.query(
    `UPDATE jogo_partida
     SET pontuacao = GREATEST(COALESCE(pontuacao, 0), $2),
         envios = envios + 1,
         finalizada_em = now()
     WHERE id = $1`,
    [partidaId, pontuacao]
  );
}

// Grava o recorde só se for MAIOR que o atual. Devolve true se gravou
// (novo recorde, ou primeiro resultado do jogador nesse jogo).
async function salvarRecordeSeMaior(usuarioId, jogo, pontuacao, partidaId) {
  const resultado = await pool.query(
    `INSERT INTO jogo_recorde (usuario_id, jogo, pontuacao, atingido_em, partida_id)
     VALUES ($1, $2, $3, now(), $4)
     ON CONFLICT (usuario_id, jogo) DO UPDATE
       SET pontuacao = EXCLUDED.pontuacao,
           atingido_em = now(),
           partida_id = EXCLUDED.partida_id
       WHERE jogo_recorde.pontuacao < EXCLUDED.pontuacao
     RETURNING pontuacao`,
    [usuarioId, jogo, pontuacao, partidaId]
  );
  return resultado.rows.length > 0;
}

// Classificação já ordenada pelo banco, limitada a `limite` linhas. Só devolve
// dados públicos (nome de exibição e avatar do perfil) — sem id nem e-mail.
// A posição é calculada sobre as linhas já limitadas, o que é correto porque
// elas são exatamente as N primeiras na mesma ordem.
async function listarClassificacao(jogo, limite) {
  const resultado = await pool.query(
    `SELECT ROW_NUMBER() OVER (ORDER BY t.pontuacao DESC, t.atingido_em ASC, t.usuario_id ASC)::int AS posicao,
            p.nome, p.avatar_url, t.pontuacao, t.atingido_em
     FROM (
       SELECT usuario_id, pontuacao, atingido_em
       FROM jogo_recorde
       WHERE jogo = $1
       ORDER BY pontuacao DESC, atingido_em ASC, usuario_id ASC
       LIMIT $2
     ) t
     JOIN perfil p ON p.id = t.usuario_id
     ORDER BY posicao`,
    [jogo, limite]
  );
  return resultado.rows;
}

async function contarJogadores(jogo) {
  const resultado = await pool.query(
    `SELECT COUNT(*)::int AS total FROM jogo_recorde WHERE jogo = $1`,
    [jogo]
  );
  return resultado.rows[0].total;
}

// Posição e pontuação de UM jogador (mesmo fora do top). Posição = 1 + quantos
// jogadores estão à frente, com o mesmo critério de desempate da classificação.
async function obterDesempenhoDoUsuario(usuarioId, jogo) {
  const resultado = await pool.query(
    `SELECT r.pontuacao, r.atingido_em,
            1 + (
              SELECT COUNT(*) FROM jogo_recorde o
              WHERE o.jogo = r.jogo
                AND (
                  o.pontuacao > r.pontuacao
                  OR (o.pontuacao = r.pontuacao AND o.atingido_em < r.atingido_em)
                  OR (o.pontuacao = r.pontuacao AND o.atingido_em = r.atingido_em AND o.usuario_id < r.usuario_id)
                )
            )::int AS posicao
     FROM jogo_recorde r
     WHERE r.usuario_id = $1 AND r.jogo = $2`,
    [usuarioId, jogo]
  );
  return resultado.rows[0] || null;
}

// O 1º colocado de cada jogo (DISTINCT ON pega a primeira linha de cada jogo
// na ordem do ranking). Jogos sem nenhum jogador simplesmente não aparecem.
async function listarLideres() {
  const resultado = await pool.query(
    `SELECT DISTINCT ON (r.jogo) r.jogo, p.nome, p.avatar_url, r.pontuacao, r.atingido_em
     FROM jogo_recorde r
     JOIN perfil p ON p.id = r.usuario_id
     ORDER BY r.jogo, r.pontuacao DESC, r.atingido_em ASC, r.usuario_id ASC`
  );
  return resultado.rows;
}

// Total de jogadores por jogo (usado junto com listarLideres).
async function contarJogadoresPorJogo() {
  const resultado = await pool.query(
    `SELECT jogo, COUNT(*)::int AS total FROM jogo_recorde GROUP BY jogo`
  );
  return resultado.rows;
}

module.exports = {
  criarPartida,
  contarPartidasUltimoMinuto,
  obterPartidaDoDono,
  registrarEnvioNaPartida,
  salvarRecordeSeMaior,
  listarClassificacao,
  contarJogadores,
  obterDesempenhoDoUsuario,
  listarLideres,
  contarJogadoresPorJogo,
};
