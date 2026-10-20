-- Limite diário de partidas valendo para o ranking.
-- Rode no SQL Editor do Supabase DEPOIS da 008_ranking_jogos.sql.
--
-- Cada jogador tem N partidas "valendo" por jogo por dia (N está em
-- config/ranking.js: PARTIDAS_VALENDO_POR_DIA). O dia vira à meia-noite no
-- horário de Brasília. Passou do limite, a partida continua jogável como
-- treino, mas não entra no ranking (valendo = false).

ALTER TABLE jogo_partida
  ADD COLUMN IF NOT EXISTS valendo BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_jogo_partida_valendo_dia
  ON jogo_partida (usuario_id, jogo, iniciada_em DESC)
  WHERE valendo;

-- Conferir: quantas partidas valendo cada jogador fez hoje (horário de Brasília)
--   SELECT p.nome, jp.jogo, COUNT(*) AS partidas_hoje
--   FROM jogo_partida jp JOIN perfil p ON p.id = jp.usuario_id
--   WHERE jp.valendo
--     AND jp.iniciada_em >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
--   GROUP BY p.nome, jp.jogo ORDER BY partidas_hoje DESC;
