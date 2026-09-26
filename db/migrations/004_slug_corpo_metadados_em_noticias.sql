-- ============================================================================
-- Migração 004: colunas de apoio pra importar as 72 notícias existentes
--
-- Só ADITIVO — nenhuma coluna existente é alterada ou removida.
--
-- - slug_origem: identifica de onde essa notícia veio nos arquivos JS
--   antigos (ex: 'geral-1', 'regiao-norte-03'). É a chave que o script de
--   importação usa pra saber "essa eu já importei" e não duplicar se
--   rodar de novo.
-- - corpo_json: guarda o array `corpo` estruturado das 12 notícias gerais
--   (parágrafos, títulos, listas, estatísticas, citações) sem achatar
--   tudo em texto puro.
-- - metadados: guarda campos extras que não têm coluna própria (autor,
--   tempo de leitura, legenda da foto, datas de publicação/atualização).
-- ============================================================================

ALTER TABLE noticias ADD COLUMN IF NOT EXISTS slug_origem TEXT;
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS corpo_json JSONB;
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS metadados JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_noticias_slug_origem
  ON noticias (slug_origem)
  WHERE slug_origem IS NOT NULL;

-- Garante que as 5 macro-regiões existam na tabela `regiao` (idempotente:
-- se já existirem com esse nome, não faz nada; se a tabela já tinha
-- outras regiões cadastradas, elas continuam intactas).
INSERT INTO regiao (nome)
SELECT nome FROM (VALUES ('Norte'), ('Nordeste'), ('Centro-Oeste'), ('Sudeste'), ('Sul')) AS r(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM regiao WHERE lower(regiao.nome) = lower(r.nome)
);
