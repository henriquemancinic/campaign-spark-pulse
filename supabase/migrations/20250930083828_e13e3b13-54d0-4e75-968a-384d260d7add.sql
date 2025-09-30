-- Inserir admin específico e corrigir warnings de segurança
BEGIN;

-- Corrigir search_path nas funções para resolver warnings de segurança
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_token_valid(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND (token_expiry IS NULL OR token_expiry > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_last_login(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = now() 
  WHERE id = user_id;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

-- Inserir usuário admin diretamente em auth.users (apenas se não existir)
-- O usuário precisa se registrar manualmente com este email e senha
-- Depois, atualizaremos o perfil para admin

-- Função para promover usuário específico a admin
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RETURN false; -- Usuário não encontrado
  END IF;
  
  -- Atualizar perfil para admin com token sem expiração
  UPDATE public.profiles 
  SET role = 'admin', 
      token_expiry = null
  WHERE id = user_uuid;
  
  RETURN true;
END;
$$;

-- Promover o usuário específico a admin (se já estiver registrado)
SELECT public.promote_to_admin('henriquemancinic@gmail.com');

COMMIT;