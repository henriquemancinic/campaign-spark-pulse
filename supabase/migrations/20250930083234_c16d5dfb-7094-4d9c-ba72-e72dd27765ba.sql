-- Recriar banco do zero com admin específico e estrutura limpa
BEGIN;

-- Limpar todas as tabelas existentes (ordem de dependências)
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.email_configs CASCADE;
DROP TABLE IF EXISTS public.email_lists CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Remover funções existentes
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_token_valid(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_last_login(uuid) CASCADE;

-- Remover tipos existentes
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.campaign_status CASCADE;

-- Remover triggers se existirem
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar tipos
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused');

-- Recriar tabela profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Usuário',
  cpf text DEFAULT '',
  company text NOT NULL DEFAULT 'Empresa',
  username text NOT NULL DEFAULT '',
  email text,
  role user_role NOT NULL DEFAULT 'user',
  token_expiry timestamptz DEFAULT (now() + interval '30 days'),
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Recriar tabela email_lists
CREATE TABLE public.email_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  emails text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Recriar tabela email_configs
CREATE TABLE public.email_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  smtp_server text NOT NULL,
  port integer NOT NULL DEFAULT 587,
  username text NOT NULL,
  password text NOT NULL,
  use_tls boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Recriar tabela campaigns
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_list_id uuid NOT NULL REFERENCES public.email_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  send_interval integer NOT NULL DEFAULT 5,
  emails_per_batch integer NOT NULL DEFAULT 10,
  sent_count integer NOT NULL DEFAULT 0,
  total_emails integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Recriar funções auxiliares
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
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

-- Função para lidar com novos usuários (apenas usuários comuns, admin já existe)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Inserir perfil como usuário comum (admin já existe manualmente)
  INSERT INTO public.profiles (
    id, name, cpf, company, username, email, role, token_expiry
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Usuário'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'cpf', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company', ''), 'Empresa'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 'user_' || substring(NEW.id::text from 1 for 8)),
    NEW.email,
    'user', -- Sempre usuário comum
    now() + interval '30 days'
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Criar triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_email_lists_updated_at
  BEFORE UPDATE ON public.email_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_email_configs_updated_at
  BEFORE UPDATE ON public.email_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Enable profile creation during registration"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (is_admin_user(auth.uid()));

-- Políticas RLS para email_lists
CREATE POLICY "Users can manage their own email lists"
  ON public.email_lists FOR ALL
  USING (auth.uid() = user_id AND is_token_valid(auth.uid()));

-- Políticas RLS para email_configs
CREATE POLICY "Users can manage their own email config"
  ON public.email_configs FOR ALL
  USING (auth.uid() = user_id AND is_token_valid(auth.uid()));

-- Políticas RLS para campaigns
CREATE POLICY "Users can manage their own campaigns"
  ON public.campaigns FOR ALL
  USING (auth.uid() = user_id AND is_token_valid(auth.uid()));

-- Conceder privilégios às roles
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.email_lists TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.email_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaigns TO authenticated;

-- Inserir o usuário administrador específico no auth.users e profiles
-- IMPORTANTE: Isto será feito após o usuário se registrar manualmente com o email específico
-- A trigger irá criar o perfil como 'user', então precisamos atualizar para 'admin' depois

COMMIT;