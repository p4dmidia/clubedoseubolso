-- PROFILE PICTURE & SETTINGS SETUP
-- Execute este script no SQL Editor do Supabase para habilitar fotos de perfil e configurações.

-- 1. Adicionar avatar_url à tabela user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Adicionar avatar_url à tabela affiliates (para manter sincronizado e facilitar o acesso)
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Criar Bucket de Armazenamento para Perfis (Storage)
-- Nota: Buckets geralmente são criados via interface ou script separado.
-- Este comando de SQL direto funciona se as extensões estiverem ativas.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas de Segurança para o Bucket de Avatars
-- Permitir que qualquer um veja as fotos (público)
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir que usuários autenticados façam upload apenas para sua própria pasta/arquivo
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
