
-- Primeiro, vamos garantir que tudo esteja limpo e recriar do zero
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recriar os tipos (caso não existam)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar a tabela profiles novamente
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'user',
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar função simplificada para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  user_role_value user_role;
BEGIN
  -- Contar usuários existentes
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Definir role baseado na contagem
  IF user_count = 0 THEN
    user_role_value = 'admin';
  ELSE
    user_role_value = 'user';
  END IF;
  
  -- Inserir novo perfil com valores padrão se metadados estiverem vazios
  INSERT INTO public.profiles (
    id, 
    name, 
    cpf, 
    company, 
    username, 
    role,
    token_expiry
  ) VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Usuário'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'cpf', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company', ''), 'Empresa'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 'user_' || substring(NEW.id::text from 1 for 8)),
    user_role_value,
    now() + interval '7 days'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se algo der errado, ainda assim permita que o usuário seja criado
    RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar políticas RLS básicas
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert profile during registration" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Função para atualizar last_login
CREATE OR REPLACE FUNCTION public.update_last_login(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = now() 
  WHERE id = user_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorar erros silenciosamente
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
