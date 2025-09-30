-- Criar tabela para rastrear progresso das campanhas
CREATE TABLE IF NOT EXISTS public.campaign_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own campaign progress" 
ON public.campaign_progress 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = campaign_progress.campaign_id 
    AND campaigns.user_id = auth.uid()
    AND is_token_valid(auth.uid())
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_campaign_progress_updated_at
BEFORE UPDATE ON public.campaign_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();