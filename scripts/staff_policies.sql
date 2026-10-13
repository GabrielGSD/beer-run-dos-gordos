-- Obsoleto: nunca conceder UPDATE/DELETE publico para autenticar o staff.
-- Aplique backend/supabase/migrations/202610120014_staff_security.sql.
DO $$ BEGIN RAISE EXCEPTION 'Use a migration 014 do backend. Este script inseguro foi desativado.'; END $$;
