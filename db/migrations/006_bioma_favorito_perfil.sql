-- Adiciona o campo que faltava pra "Meu Bioma" persistir de verdade.
-- Sem isso a escolha só existia em memória e sumia ao trocar de tela.
ALTER TABLE perfil
  ADD COLUMN IF NOT EXISTS bioma_favorito TEXT;

-- Trava os 6 biomas reais do projeto no banco também (não só no front),
-- pra nenhum valor fora da lista entrar aqui por engano.
ALTER TABLE perfil
  DROP CONSTRAINT IF EXISTS perfil_bioma_favorito_valido;

ALTER TABLE perfil
  ADD CONSTRAINT perfil_bioma_favorito_valido
  CHECK (
    bioma_favorito IS NULL OR bioma_favorito IN (
      'Amazônia', 'Cerrado', 'Caatinga', 'Mata Atlântica', 'Pampa', 'Pantanal'
    )
  );
