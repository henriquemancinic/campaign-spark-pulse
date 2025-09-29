-- Recria função e trigger para criação automática de perfis e migra usuários sem perfil
begin;

-- 1) Função com SECURITY DEFINER e search_path correto
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_count integer;
  user_role_value user_role;
  token_expiry_value timestamptz;
begin
  -- Contar perfis existentes para definir o primeiro usuário como admin
  select count(*) into profile_count from public.profiles;

  if profile_count = 0 then
    user_role_value := 'admin';
    token_expiry_value := null; -- Admin sem expiração
  else
    user_role_value := 'user';
    token_expiry_value := now() + interval '30 days';
  end if;

  -- Inserir perfil; ignora se já existir
  insert into public.profiles (
    id, name, cpf, company, username, email, role, token_expiry
  ) values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), 'Usuário'),
    coalesce(nullif(new.raw_user_meta_data->>'cpf', ''), ''),
    coalesce(nullif(new.raw_user_meta_data->>'company', ''), 'Empresa'),
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user_' || substring(new.id::text from 1 for 8)),
    new.email,
    user_role_value,
    token_expiry_value
  ) on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Logar sem quebrar o signup
    raise warning 'Erro ao criar perfil para usuário %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- 2) Tentar garantir owner para bypass de RLS (não falhar se sem permissão)
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) then
    begin
      alter function public.handle_new_user() owner to postgres;
    exception when insufficient_privilege then
      raise notice 'Sem permissão para alterar o owner da função handle_new_user.';
    when others then
      raise notice 'Não foi possível alterar o owner: %', sqlerrm;
    end;
  end if;
end $$;

-- 3) Recriar trigger em auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;

-- 4) Migrar usuários existentes sem perfil
DO $$
DECLARE
  user_record RECORD;
  is_first_user BOOLEAN := TRUE;
BEGIN
  -- Se já existem perfis, não é mais o primeiro usuário
  IF (SELECT COUNT(*) FROM public.profiles) > 0 THEN
    is_first_user := FALSE;
  END IF;

  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    ORDER BY au.created_at ASC
  LOOP
    INSERT INTO public.profiles (
      id, name, cpf, company, username, email, role, token_expiry
    ) VALUES (
      user_record.id,
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'name', ''), 'Usuário'),
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'cpf', ''), ''),
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'company', ''), 'Empresa'),
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'username', ''), 'user_' || substring(user_record.id::text from 1 for 8)),
      user_record.email,
      CASE WHEN is_first_user THEN 'admin'::user_role ELSE 'user'::user_role END,
      CASE WHEN is_first_user THEN NULL ELSE now() + interval '30 days' END
    ) ON CONFLICT (id) DO NOTHING;

    is_first_user := FALSE;
  END LOOP;
END $$;