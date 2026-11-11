-- ===================================================================
-- RECEITUÁRIO: LIVRO DE RECEITAS COLABORATIVO (SUPABASE / POSTGRESQL)
-- Backend & Banco de dados unificado via Supabase
-- Execute este script completo no SQL Editor do seu projeto Supabase
-- ===================================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE ALUNOS (vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    turma TEXT DEFAULT 'Turma 3B',
    modulo TEXT DEFAULT 'Gastronomia Geral',
    bio TEXT DEFAULT '',
    initials TEXT NOT NULL DEFAULT 'AL',
    is_staff BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color_token TEXT NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE RECEITAS
CREATE TABLE IF NOT EXISTS public.recipes (
    id BIGSERIAL PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes > 0),
    servings TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Fácil' CHECK (difficulty IN ('Fácil', 'Médio', 'Difícil')),
    is_hidden BOOLEAN DEFAULT false,
    is_draft BOOLEAN DEFAULT false,
    chef_tip TEXT DEFAULT '',
    photo_tag TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INGREDIENTES DA RECEITA
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT DEFAULT '',
    "order" INTEGER DEFAULT 0
);

-- 5. PASSOS DE PREPARO DA RECEITA
CREATE TABLE IF NOT EXISTS public.recipe_steps (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT '',
    text TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
);

-- ===================================================================
-- TRIGGER AUTOMÁTICO: CRIAÇÃO DE PERFIL AO CADASTRAR NO SUPABASE AUTH
-- O primeiro usuário registrado torna-se automaticamente Administrador (is_staff = true)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    profile_count INTEGER;
    clean_username TEXT;
    user_initials TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    SELECT count(*) INTO profile_count FROM public.profiles;

    clean_username := COALESCE(
        new.raw_user_meta_data->>'username',
        split_part(new.email, '@', 1)
    );

    first_name := split_part(COALESCE(new.raw_user_meta_data->>'full_name', clean_username), ' ', 1);
    last_name := split_part(COALESCE(new.raw_user_meta_data->>'full_name', clean_username), ' ', 2);
    
    IF last_name <> '' THEN
        user_initials := UPPER(SUBSTRING(first_name, 1, 1) || SUBSTRING(last_name, 1, 1));
    ELSE
        user_initials := UPPER(SUBSTRING(clean_username, 1, 2));
    END IF;

    INSERT INTO public.profiles (
        auth_user_id,
        username,
        full_name,
        turma,
        modulo,
        bio,
        initials,
        is_staff,
        is_active
    )
    VALUES (
        new.id,
        clean_username,
        COALESCE(new.raw_user_meta_data->>'full_name', clean_username),
        COALESCE(new.raw_user_meta_data->>'turma', CASE WHEN profile_count = 0 THEN 'Coordenação Pedagógica' ELSE 'Turma 3B' END),
        CASE WHEN profile_count = 0 THEN 'Administrador do Caderno' ELSE 'Gastronomia Geral' END,
        CASE WHEN profile_count = 0 THEN 'Administrador e Coordenador Geral do Receituário.' ELSE 'Estudante de gastronomia.' END,
        user_initials,
        CASE WHEN profile_count = 0 OR clean_username = 'admin' THEN true ELSE false END,
        true
    )
    ON CONFLICT (auth_user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        turma = EXCLUDED.turma;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA EM NÍVEL DE BANCO
-- ===================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Categorias: Leitura pública; edição apenas por Admin
DROP POLICY IF EXISTS "Categorias leitura pública" ON public.categories;
CREATE POLICY "Categorias leitura pública" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin gerencia categorias" ON public.categories;
CREATE POLICY "Admin gerencia categorias" ON public.categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    );

-- 2. Perfis: Leitura pública; edição apenas do próprio perfil ou por Admin
DROP POLICY IF EXISTS "Perfis visíveis publicamente" ON public.profiles;
CREATE POLICY "Perfis visíveis publicamente" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuário edita próprio perfil" ON public.profiles;
CREATE POLICY "Usuário edita próprio perfil" ON public.profiles
    FOR UPDATE USING (
        auth_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    );

DROP POLICY IF EXISTS "Usuário exclui própria conta" ON public.profiles;
CREATE POLICY "Usuário exclui própria conta" ON public.profiles
    FOR DELETE USING (
        auth_user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    );

-- 3. Receitas:
-- Visitantes veem receitas públicas (não ocultas e não rascunhos)
-- Autores e admins veem também suas receitas ocultas/rascunhos
DROP POLICY IF EXISTS "Receitas leitura pública" ON public.recipes;
CREATE POLICY "Receitas leitura pública" ON public.recipes
    FOR SELECT USING (
        (is_hidden = false AND is_draft = false) OR
        (auth.uid() IS NOT NULL AND author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    );

-- Inserção permitida para usuário autenticado (autor é garantido como o próprio usuário)
DROP POLICY IF EXISTS "Alunos autenticados criam receitas" ON public.recipes;
CREATE POLICY "Alunos autenticados criam receitas" ON public.recipes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- Edição SOMENTE pelo autor da receita ou por Administrador (is_staff)
DROP POLICY IF EXISTS "Somente autor ou admin edita receita" ON public.recipes;
CREATE POLICY "Somente autor ou admin edita receita" ON public.recipes
    FOR UPDATE USING (
        author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    );

-- Exclusão SOMENTE pelo autor da receita ou por Administrador (is_staff)
DROP POLICY IF EXISTS "Somente autor ou admin exclui receita" ON public.recipes;
CREATE POLICY "Somente autor ou admin exclui receita" ON public.recipes
    FOR DELETE USING (
        author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    );

-- 4. Ingredientes:
DROP POLICY IF EXISTS "Ingredientes leitura pública" ON public.recipe_ingredients;
CREATE POLICY "Ingredientes leitura pública" ON public.recipe_ingredients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Ingredientes gerenciamento pelo autor" ON public.recipe_ingredients;
CREATE POLICY "Ingredientes gerenciamento pelo autor" ON public.recipe_ingredients FOR ALL USING (
    recipe_id IN (
        SELECT id FROM public.recipes WHERE
            author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    )
);

-- 5. Passos:
DROP POLICY IF EXISTS "Passos leitura pública" ON public.recipe_steps;
CREATE POLICY "Passos leitura pública" ON public.recipe_steps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Passos gerenciamento pelo autor" ON public.recipe_steps;
CREATE POLICY "Passos gerenciamento pelo autor" ON public.recipe_steps FOR ALL USING (
    recipe_id IN (
        SELECT id FROM public.recipes WHERE
            author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND is_staff = true)
    )
);

-- ===================================================================
-- SEED DE CATEGORIAS OFICIAIS (Caderno Coletivo)
-- ===================================================================

INSERT INTO public.categories (name, slug, color_token, "order") VALUES
    ('Doces', 'doces', 'doces', 1),
    ('Massas', 'massas', 'massas', 2),
    ('Carnes', 'carnes', 'carnes', 3),
    ('Lanches', 'lanches', 'lanches', 4),
    ('Saladas', 'saladas', 'saladas', 5),
    ('Bebidas', 'bebidas', 'bebidas', 6)
ON CONFLICT (slug) DO UPDATE SET
    color_token = EXCLUDED.color_token,
    "order" = EXCLUDED."order";
