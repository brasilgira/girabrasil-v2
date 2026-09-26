-- ============================================================================
-- Migração 005: adiciona o bioma às notícias
--
-- Algumas notícias gerais já possuem o campo "bioma" nos arquivos JS.
-- A coluna é separada de regiao_id:
--
-- regiao_id = macro-região brasileira
-- bioma     = bioma relacionado à notícia
--
-- A coluna é opcional porque nem toda notícia precisa ter um bioma definido.
-- ============================================================================

ALTER TABLE noticias
ADD COLUMN IF NOT EXISTS bioma TEXT;