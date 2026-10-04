-- Histórico de conversas do GiraBot por usuário (Fase: persistência do
-- GiraBot). Rode isto manualmente no SQL Editor do Supabase — não é
-- aplicado automaticamente por nenhum script do projeto.

CREATE TABLE IF NOT EXISTS girabot_conversa (
  id SERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  titulo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_girabot_conversa_usuario
  ON girabot_conversa (usuario_id, atualizado_em DESC);

CREATE TABLE IF NOT EXISTS girabot_mensagem (
  id SERIAL PRIMARY KEY,
  conversa_id INTEGER NOT NULL REFERENCES girabot_conversa(id) ON DELETE CASCADE,
  papel TEXT NOT NULL CHECK (papel IN ('user', 'assistant')),
  conteudo TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_girabot_mensagem_conversa
  ON girabot_mensagem (conversa_id, ordem);

-- Conferir depois de rodar:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name IN ('girabot_conversa', 'girabot_mensagem');
