-- Add Gamification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS league TEXT DEFAULT 'recruta',
ADD COLUMN IF NOT EXISTS dracmas INTEGER DEFAULT 0;

-- Product Access & Ranking Groups
-- Links users to specific challenges or the global coliseum
CREATE TABLE IF NOT EXISTS public.user_product_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL, -- e.g., 'abdome_insano', 'coliseu_global'
  access_level TEXT DEFAULT 'member', -- 'member', 'admin'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Community Announcements (Avisos)
CREATE TABLE IF NOT EXISTS public.community_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  importance_level TEXT DEFAULT 'normal' -- 'normal', 'high', 'urgent'
);

-- Community Posts (Feed Geral)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image', 'video'
  parent_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE -- For comments
);

-- Community Reactions
CREATE TABLE IF NOT EXISTS public.community_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES public.community_announcements(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- '🔥', '💪', '🏆', etc.
  CONSTRAINT one_target CHECK (
    (post_id IS NOT NULL AND announcement_id IS NULL) OR 
    (post_id IS NULL AND announcement_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id, announcement_id, reaction_type)
);

-- Hustle Points Log
CREATE TABLE IF NOT EXISTS public.user_hustle_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  action_type TEXT NOT NULL, -- 'workout_complete', 'diet_log', 'diet_adherence', 'habit_water', etc.
  points INTEGER NOT NULL,
  group_id TEXT, -- e.g., 'abdome_insano' or 'global'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Badges Definitions
CREATE TABLE IF NOT EXISTS public.badges_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'consistencia', 'competicao', 'saude'
  criteria_type TEXT, -- 'streak', 'points', 'ranking'
  criteria_value INTEGER
);

-- User Badges (Earned)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges_definitions(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_product_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_hustle_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Product Access: Users can view their own access
CREATE POLICY "Users can view their own access" ON public.user_product_access FOR SELECT USING (auth.uid() = user_id);

-- Announcements: Anyone can read
CREATE POLICY "Announcements are viewable by everyone" ON public.community_announcements FOR SELECT USING (true);

-- Posts: Viewable by everyone, insert by authenticated users, delete/update by owner
CREATE POLICY "Posts are viewable by everyone" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.community_posts FOR DELETE USING (auth.uid() = user_id);

-- Reactions: Viewable by everyone, users can react/unreact
CREATE POLICY "Reactions are viewable by everyone" ON public.community_reactions FOR SELECT USING (true);
CREATE POLICY "Users can react" ON public.community_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.community_reactions FOR DELETE USING (auth.uid() = user_id);

-- Hustle Points: Users can view their own points
CREATE POLICY "Users can view their own points" ON public.user_hustle_points FOR SELECT USING (auth.uid() = user_id);

-- Badges: Definitions viewable by everyone, user badges viewable by everyone
CREATE POLICY "Badge definitions are public" ON public.badges_definitions FOR SELECT USING (true);
CREATE POLICY "User badges are public" ON public.user_badges FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_hustle_points_user_id ON public.user_hustle_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_product_access_user_id ON public.user_product_access(user_id);

-- Insert Initial Badge Definitions
INSERT INTO public.badges_definitions (name, description, icon_name, category, criteria_type, criteria_value)
VALUES 
('🔥 Tocha Acesa', '7 dias de streak', 'Flame', 'consistencia', 'streak', 7),
('⚔️ Gladiador', '30 dias de streak', 'Sword', 'consistencia', 'streak', 30),
('🏛️ Coliseu', 'Top 10 no ranking global', 'Landmark', 'competicao', 'ranking', 10),
('👑 Imperador', '1º lugar em qualquer ranking', 'Crown', 'competicao', 'ranking', 1),
('💧 Hidratado', '30 dias batendo meta de água', 'Droplets', 'saude', 'habit_water', 30),
('🥗 Disciplina', '30 dias registrando refeições', 'Apple', 'saude', 'diet_log', 30)
ON CONFLICT DO NOTHING;
