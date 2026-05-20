-- Adiciona colunas para transparência e prova do sorteio
ALTER TABLE public.consortium_draws 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS official_result_url TEXT;

COMMENT ON COLUMN public.consortium_draws.video_url IS 'Link para vídeo ou gravação do sorteio (opcional)';
COMMENT ON COLUMN public.consortium_draws.official_result_url IS 'Link para o resultado oficial no site da Caixa (opcional)';
