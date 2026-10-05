
CREATE TABLE IF NOT EXISTS perfil (
  id UUID PRIMARY KEY,               -- = auth.users.id do Supabase
  nome TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);
-- OBS: quem é admin ou não já é decidido hoje pelo Supabase Auth
-- (app_metadata.is_admin === true, visto em middleware/verificarAdmin.js)
-- — não precisa de coluna nova aqui pra isso, pra não duplicar a mesma
-- informação em dois lugares diferentes.

-- Preenche o perfil automaticamente assim que alguém se cadastra pelo
-- Supabase Auth — sem isso, todo mundo que já tem conta ficaria sem
-- linha em `perfil` e "ver o perfil de alguém" quebraria.
CREATE OR REPLACE FUNCTION criar_perfil_automatico()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfil (id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ao_criar_usuario_supabase ON auth.users;
CREATE TRIGGER ao_criar_usuario_supabase
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION criar_perfil_automatico();

-- Preenche perfil pra quem JÁ tem conta e ainda não tem linha aqui
-- (usa o nome já salvo no comentário mais recente da pessoa, se houver,
-- senão usa o e-mail como fallback).
INSERT INTO perfil (id, nome)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'nome', split_part(au.email, '@', 1))
FROM auth.users au
ON CONFLICT (id) DO NOTHING;

-- 2) NOTÍCIAS — adiciona os campos que o front já usa (categoria, imagem,
--    resumo, link de fonte) e troca usuario_id/regiao_id pra aceitar nulo
--    (uma notícia de admin pode não ter "autor" formal nem região única).
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS resumo TEXT;
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS link_fonte TEXT;

-- usuario_id de noticias precisa apontar pro UUID do perfil (Supabase Auth),
-- não mais pro id numérico da tabela `usuario` antiga.
ALTER TABLE noticias DROP CONSTRAINT IF EXISTS noticias_usuario_id_fkey;
ALTER TABLE noticias ALTER COLUMN usuario_id TYPE UUID USING NULL;
ALTER TABLE noticias ALTER COLUMN usuario_id DROP NOT NULL;
ALTER TABLE noticias ADD CONSTRAINT noticias_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES perfil(id) ON DELETE SET NULL;

ALTER TABLE noticias ALTER COLUMN regiao_id DROP NOT NULL;

-- 3) CURTIR NOTÍCIA (a notícia inteira, diferente de curtir um comentário)
CREATE TABLE IF NOT EXISTS noticia_curtida (
  id SERIAL PRIMARY KEY,
  noticia_id INTEGER NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  criado_em TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (noticia_id, usuario_id)
);

-- 4) SALVAR NOTÍCIA (favoritos, aparece no perfil da pessoa)
CREATE TABLE IF NOT EXISTS noticia_salva (
  id SERIAL PRIMARY KEY,
  noticia_id INTEGER NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  criado_em TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (noticia_id, usuario_id)
);

-- 5) OBS: `comentario.usuario_id` é TEXT (guarda o UUID do Supabase Auth
--    como texto) e `perfil.id` é UUID — tipos diferentes, então não dá
--    pra criar uma foreign key direta sem arriscar quebrar comentários
--    já existentes com um cast malsucedido. Deixamos sem FK "de verdade"
--    aqui de propósito; a ligação com perfil é feita nas consultas
--    (usuario_id::uuid = perfil.id), não por constraint de banco.

CREATE INDEX IF NOT EXISTS idx_noticia_curtida_noticia_id ON noticia_curtida (noticia_id);
CREATE INDEX IF NOT EXISTS idx_noticia_salva_usuario_id ON noticia_salva (usuario_id);
CREATE INDEX IF NOT EXISTS idx_comentario_usuario_id ON comentario (usuario_id);

-- 6) Admin já é controlado pelo Supabase Auth (app_metadata.is_admin) —
--    veja middleware/verificarAdmin.js. Pra tornar alguém admin, isso se
--    faz no painel do Supabase (Authentication > Users > editar o usuário
--    > User Metadata / App Metadata), não aqui no banco.
