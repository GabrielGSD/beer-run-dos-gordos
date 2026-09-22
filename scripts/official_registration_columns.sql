-- ====================================================================
-- BEER RUN DOS GORDOS - COLUNAS PARA INSCRIÇÃO OFICIAL COMPLETA
-- ====================================================================
-- Execute este script no SQL Editor do seu painel Supabase para habilitar
-- todos os dados detalhados da inscrição oficial dos atletas.

DO $$ 
BEGIN 
    -- 1. Documento do atleta (CPF)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'cpf'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN cpf TEXT;
    END IF;

    -- 2. Data de Nascimento
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'birth_date'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN birth_date DATE;
    END IF;

    -- 3. Gênero / Sexo ('M' ou 'F') para premiação simbólica
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'gender'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN gender TEXT;
    END IF;

    -- 4. E-mail do atleta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN email TEXT;
    END IF;

    -- 5. Cidade / UF
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'city_state'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN city_state TEXT;
    END IF;

    -- 6. Contato de Emergência - Nome
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'emergency_contact_name'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN emergency_contact_name TEXT;
    END IF;

    -- 7. Contato de Emergência - Telefone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'emergency_contact_phone'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN emergency_contact_phone TEXT;
    END IF;

    -- 8. Tamanho da Camiseta do Kit Oficial
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'shirt_size'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN shirt_size TEXT;
    END IF;

    -- 9. Observações médicas, alergias ou restrições de saúde
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'medical_notes'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN medical_notes TEXT;
    END IF;

    -- 10. Data/hora de aceite do regulamento oficial da prova
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'accepted_terms_at'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN accepted_terms_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 11. Tipo de inscrição ('pre_registration' ou 'official')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'registration_type'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN registration_type TEXT DEFAULT 'pre_registration';
    ELSE
        ALTER TABLE public.athletes ALTER COLUMN registration_type SET DEFAULT 'pre_registration';
    END IF;

    -- 12. Status de Pagamento da Inscrição ('pending_payment' ou 'completed')
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.athletes ADD COLUMN payment_status TEXT DEFAULT NULL;
    END IF;

    -- 13. Saneamento: Atletas que apenas fizeram pré-inscrição (sem aceite dos termos)
    -- devem ficar como 'pre_registration' e payment_status = NULL
    UPDATE public.athletes
    SET registration_type = 'pre_registration',
        payment_status = NULL
    WHERE accepted_terms_at IS NULL;

    -- Atletas que já aceitaram termos e preencheram dados oficiais
    UPDATE public.athletes
    SET registration_type = 'official',
        payment_status = 'pending_payment'
    WHERE accepted_terms_at IS NOT NULL AND (payment_status IS NULL OR payment_status = '');
END $$;

