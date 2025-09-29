-- Verificar e criar o trigger faltante para criação automática de perfis
-- Primeiro, verificar se o trigger já existe e removê-lo se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verificar se a função handle_new_user existe, caso contrário criá-la
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INTEGER;
  user_role_value user_role;
  token_expiry_value TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Contar perfis existentes para determinar se é o primeiro usuário
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  -- Primeiro usuário se torna admin, demais são users
  IF profile_count = 0 THEN
    user_role_value = 'admin';
    token_expiry_value = NULL; -- Admin não tem expiração
  ELSE
    user_role_value = 'user';
    token_expiry_value = now() + interval '30 days';
  END IF;
  
  -- Inserir novo perfil com dados do registro
  INSERT INTO public.profiles (
    id, 
    name, 
    cpf, 
    company, 
    username,
    email,
    role,
    token_expiry
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Usuário'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'cpf', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company', ''), 'Empresa'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 'user_' || substring(NEW.id::text from 1 for 8)),
    NEW.email,
    user_role_value,
    token_expiry_value
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas permite que o usuário seja criado
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrar usuários existentes (criar perfis para usuários sem perfil)
DO $$
DECLARE
  user_record RECORD;
  is_first_user BOOLEAN := TRUE;
  profile_count INTEGER;
BEGIN
  -- Verificar quantos perfis já existem
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  -- Se já existem perfis, não é mais o primeiro usuário
  IF profile_count > 0 THEN
    is_first_user := FALSE;
  END IF;
  
  -- Verificar se existem usuários sem perfil e criar perfis para eles
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    ORDER BY au.created_at ASC
  LOOP
    INSERT INTO public.profiles (
      id, 
      name, 
      cpf, 
      company, 
      username,
      email,
      role,
      token_expiry
    ) VALUES (
      user_record.id,
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'name', ''), 'Usuário'),
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'cpf', ''), ''),
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'company', ''), 'Empresa'),
      COALESCE(NULLIF(user_record.raw_user_meta_data->>'username', ''), 'user_' || substring(user_record.id::text from 1 for 8)),
      user_record.email,
      CASE WHEN is_first_user THEN 'admin'::user_role ELSE 'user'::user_role END,
      CASE WHEN is_first_user THEN NULL ELSE now() + interval '30 days' END
    );
    
    -- Após o primeiro usuário, todos os demais são users
    is_first_user := FALSE;
    
    RAISE NOTICE 'Perfil criado para usuário existente: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE 'Migração de usuários existentes concluída';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro na migração de usuários existentes: %', SQLERRM;
END $$;