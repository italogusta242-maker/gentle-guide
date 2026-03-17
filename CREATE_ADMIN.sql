
-- ==================================================================================
-- SCRIPT DE CRIAÇÃO DO USUÁRIO ADMIN (SHAPE INSANO)
-- Passo 1: Vá em Authentication > Users > Add User e crie o usuário com o email italogusta242@gmail.com
-- Passo 2: Copie o ID (UUID) dele e substitua abaixo onde diz 'e5e762f7-6e07-46ef-94e9-0ab1955f3a91'
-- ==================================================================================

-- 1. Garante que o perfil existe com os dados corretos
INSERT INTO public.profiles (id, nome, email, onboarded)
VALUES 
  ('e5e762f7-6e07-46ef-94e9-0ab1955f3a91', 'Admin Italo', 'italogusta242@gmail.com', true)
ON CONFLICT (id) DO UPDATE 
SET onboarded = true, nome = 'Admin Italo';

-- 2. Atribui a role de admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('e5e762f7-6e07-46ef-94e9-0ab1955f3a91', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Inicializa a gamificação para o admin (evita erro de carregar dashboard)
INSERT INTO public.gamification (user_id, level, xp)
VALUES ('e5e762f7-6e07-46ef-94e9-0ab1955f3a91', 99, 999999)
ON CONFLICT (user_id) DO NOTHING;
