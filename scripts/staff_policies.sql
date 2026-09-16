-- ====================================================================
-- BEER RUN DOS GORDOS - POLÍTICAS DE ACESSO E COLUNAS DE STAFF / ADMIN
-- ====================================================================
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Colunas opcionais para Check-in e Presença no dia da prova na tabela athletes
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'is_checked_in'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN is_checked_in BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'checked_in_at'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Permissões completas na tabela athletes (UPDATE e DELETE para o painel de staff)
DROP POLICY IF EXISTS "Permitir update publico de atletas" ON public.athletes;
CREATE POLICY "Permitir update publico de atletas"
ON public.athletes
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete publico de atletas" ON public.athletes;
CREATE POLICY "Permitir delete publico de atletas"
ON public.athletes
FOR DELETE
TO public
USING (true);

-- 3. Permissões completas na tabela athlete_waitlist (UPDATE e DELETE)
DROP POLICY IF EXISTS "Permitir update na lista de espera" ON public.athlete_waitlist;
CREATE POLICY "Permitir update na lista de espera"
ON public.athlete_waitlist
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete na lista de espera" ON public.athlete_waitlist;
CREATE POLICY "Permitir delete na lista de espera"
ON public.athlete_waitlist
FOR DELETE
TO public
USING (true);

-- 4. Permissões completas na tabela sponsorship_proposals (UPDATE e DELETE)
DROP POLICY IF EXISTS "Permitir update de propostas de patrocinio" ON public.sponsorship_proposals;
CREATE POLICY "Permitir update de propostas de patrocinio"
ON public.sponsorship_proposals
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir delete de propostas de patrocinio" ON public.sponsorship_proposals;
CREATE POLICY "Permitir delete de propostas de patrocinio"
ON public.sponsorship_proposals
FOR DELETE
TO public
USING (true);
