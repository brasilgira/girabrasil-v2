-- Ranking dos jogos (Sapo, Onça e Mico).
-- Rode manualmente no SQL Editor do Supabase — não é aplicado automaticamente
-- por nenhum script do projeto (mesmo padrão das migrações anteriores).
--
-- Visão geral:
--   jogo_partida  = cada partida iniciada (o servidor guarda a hora de início,
--                   usada depois para checar se a pontuação enviada é plausível).
--   jogo_recorde  = o MELHOR resultado de cada jogador em cada jogo. É esta
--                   tabela que alimenta a página Ranking.
--
-- Chaves dos jogos (iguais às usadas em controllers/ranking.controller.js):
--   'sapo' = De Volta ao Rio  (metros)
--   'onca' = Fuga pela Floresta (metros)
--   'mico' = Jogo do Mico (pontos)

CREATE TABLE IF NOT EXISTS jogo_partida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  jogo TEXT NOT NULL CHECK (jogo IN ('sapo', 'onca', 'mico')),
  iniciada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizada_em TIMESTAMPTZ,
  pontuacao INTEGER CHECK (pontuacao IS NULL OR pontuacao >= 0),
  envios SMALLINT NOT NULL DEFAULT 0
);

-- Usado pelo limite de partidas por minuto de cada usuário.
CREATE INDEX IF NOT EXISTS idx_jogo_partida_usuario_inicio
  ON jogo_partida (usuario_id, iniciada_em DESC);

CREATE TABLE IF NOT EXISTS jogo_recorde (
  usuario_id UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  jogo TEXT NOT NULL CHECK (jogo IN ('sapo', 'onca', 'mico')),
  pontuacao INTEGER NOT NULL CHECK (pontuacao > 0),
  atingido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  partida_id UUID REFERENCES jogo_partida(id) ON DELETE SET NULL,
  PRIMARY KEY (usuario_id, jogo)
);

-- Ordem do ranking: maior pontuação primeiro; em empate, quem chegou
-- primeiro a essa pontuação (atingido_em menor) fica na frente.
CREATE INDEX IF NOT EXISTS idx_jogo_recorde_ranking
  ON jogo_recorde (jogo, pontuacao DESC, atingido_em ASC, usuario_id ASC);

-- ---------------------------------------------------------------------------
-- Manutenção opcional (não rode junto com a migração):
--
-- Partidas antigas só servem de histórico/auditoria. Para limpar as de mais
-- de 90 dias (o recorde de cada jogador continua intacto):
--   DELETE FROM jogo_partida WHERE iniciada_em < now() - interval '90 days';
--
-- Conferir o histórico de quem está em 1º antes de entregar o prêmio:
--   SELECT p.nome, jp.jogo, jp.pontuacao, jp.iniciada_em, jp.finalizada_em
--   FROM jogo_partida jp JOIN perfil p ON p.id = jp.usuario_id
--   WHERE jp.usuario_id = '<uuid do jogador>' AND jp.jogo = 'sapo'
--   ORDER BY jp.iniciada_em DESC LIMIT 50;
--
-- Remover o resultado de alguém do ranking (ex.: resultado suspeito):
--   DELETE FROM jogo_recorde WHERE usuario_id = '<uuid>' AND jogo = 'sapo';
--
-- Conferir depois de rodar:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_name IN ('jogo_partida', 'jogo_recorde');
-- ---------------------------------------------------------------------------
