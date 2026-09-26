-- ============================================================================
-- Validação da importação das 72 notícias
-- Rode isso no SQL Editor do Supabase depois de rodar o script de importação.
-- ============================================================================

-- 1) Total geral (esperado: 72)
SELECT COUNT(*) AS total_noticias FROM noticias WHERE slug_origem IS NOT NULL;

-- 2) Quebra por origem (esperado: geral = 12, cada região = 12)
SELECT
  CASE
    WHEN slug_origem LIKE 'geral-%' THEN 'geral'
    ELSE regexp_replace(slug_origem, '^regiao-([a-z-]+)-\d+$', '\1')
  END AS origem,
  COUNT(*) AS quantidade
FROM noticias
WHERE slug_origem IS NOT NULL
GROUP BY origem
ORDER BY origem;

-- 3) Confere se tem slug_origem duplicado (esperado: 0 linhas)
SELECT slug_origem, COUNT(*)
FROM noticias
WHERE slug_origem IS NOT NULL
GROUP BY slug_origem
HAVING COUNT(*) > 1;

-- 4) Confirma que as 12 gerais mantiveram o corpo estruturado (esperado:
--    todas com corpo_json preenchido, nenhuma com null)
SELECT COUNT(*) AS gerais_sem_corpo_json
FROM noticias
WHERE slug_origem LIKE 'geral-%' AND corpo_json IS NULL;

-- 5) Dá uma olhada no conteúdo pra conferir visualmente
SELECT id, slug_origem, titulo, categoria, bioma, regiao_id, criado_em
FROM noticias
WHERE slug_origem IS NOT NULL
ORDER BY slug_origem;
