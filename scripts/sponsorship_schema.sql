-- =======================================================
-- BEER RUN DOS GORDOS - TABELA DE PROPOSTAS DE PATROCÍNIO
-- =======================================================

-- 1. Criação da tabela de propostas de patrocínio
CREATE TABLE IF NOT EXISTS public.sponsorship_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    website_instagram TEXT,
    sponsorship_type TEXT NOT NULL, -- 'money', 'gifts', 'structure', 'mixed'
    amount TEXT,                    -- Valor financeiro informado
    items_description TEXT,         -- Descrição de brindes/produtos/estrutura
    activations JSONB DEFAULT '[]'::jsonb, -- Lista de ativações selecionadas
    notes TEXT,                     -- Observações ou ideias adicionais
    logo_url TEXT,                  -- URL do logo no Supabase Storage
    status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'contacted', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitação de Segurança por Nível de Linha (RLS)
ALTER TABLE public.sponsorship_proposals ENABLE ROW LEVEL SECURITY;

-- 3. Limpeza de políticas existentes
DROP POLICY IF EXISTS "Permitir insercao publica de propostas de patrocinio" ON public.sponsorship_proposals;
DROP POLICY IF EXISTS "Permitir leitura publica de propostas de patrocinio" ON public.sponsorship_proposals;
DROP POLICY IF EXISTS "Permitir leitura apenas para autenticados" ON public.sponsorship_proposals;

-- 4. Política: Qualquer visitante pode inserir propostas (anônimo ou autenticado)
CREATE POLICY "Permitir insercao publica de propostas de patrocinio"
ON public.sponsorship_proposals
FOR INSERT
TO public
WITH CHECK (true);

-- 5. Política: Leitura dos dados
CREATE POLICY "Permitir leitura publica de propostas de patrocinio"
ON public.sponsorship_proposals
FOR SELECT
TO public
USING (true);

-- 6. Políticas para o Supabase Storage (Bucket: sponsor-logos)
DROP POLICY IF EXISTS "Upload publico de logos de patrocinadores" ON storage.objects;
DROP POLICY IF EXISTS "Acesso publico aos logos de patrocinadores" ON storage.objects;

CREATE POLICY "Upload publico de logos de patrocinadores"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'sponsor-logos');

CREATE POLICY "Acesso publico aos logos de patrocinadores"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'sponsor-logos');

