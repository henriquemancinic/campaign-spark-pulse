-- Corrigir erro 403 ao ler perfis: conceder privilégios básicos às roles
begin;

-- Garantir acesso ao schema
grant usage on schema public to authenticated;
-- grant usage on schema public to anon; -- opcional, mantendo apenas autenticados

-- Conceder privilégios na tabela de perfis (RLS continuará restringindo as linhas)
grant select, insert, update on table public.profiles to authenticated;

commit;