-- =======================================================
-- BEER RUN DOS GORDOS - TABELA DE LISTA DE ESPERA
-- =======================================================

-- 1. Criação da tabela de lista de espera
CREATE TABLE IF NOT EXISTS public.athlete_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT NOT NULL,
    modality TEXT DEFAULT 'corrida',
    drinks_beer BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'waiting', -- 'waiting', 'called', 'registered', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitação de Segurança por Nível de Linha (RLS)
ALTER TABLE public.athlete_waitlist ENABLE ROW LEVEL SECURITY;

-- 3. Limpeza de políticas existentes
DROP POLICY IF EXISTS "Permitir insercao publica na lista de espera" ON public.athlete_waitlist;
DROP POLICY IF EXISTS "Permitir leitura publica na lista de espera" ON public.athlete_waitlist;

-- 4. Política: Qualquer visitante pode entrar na lista de espera (pública)
CREATE POLICY "Permitir insercao publica na lista de espera"
ON public.athlete_waitlist
FOR INSERT
TO public
WITH CHECK (true);

-- 5. Política: Leitura dos registros
CREATE POLICY "Permitir leitura publica na lista de espera"
ON public.athlete_waitlist
FOR SELECT
TO public
USING (true);
