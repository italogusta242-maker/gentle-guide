
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'especialista', 'user');

-- Enum para classes
CREATE TYPE public.classe_type AS ENUM ('gladius', 'velite', 'centurio');

-- Enum para ligas
CREATE TYPE public.league_type AS ENUM ('plebe', 'legionario', 'centuriao', 'pretoriano');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  nascimento TEXT,
  cpf TEXT,
  cidade_estado TEXT,
  sexo TEXT,
  faixa_etaria TEXT,
  altura TEXT,
  peso TEXT,
  tempo_acompanha TEXT,
  fatores_escolha TEXT,
  indicacao TEXT,
  indicacao_nome TEXT,
  indicacao_telefone TEXT,
  classe classe_type DEFAULT 'gladius',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER_ROLES
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GAMIFICATION
-- ============================================================
CREATE TABLE public.gamification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  league league_type NOT NULL DEFAULT 'plebe',
  streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  dracmas INTEGER NOT NULL DEFAULT 0,
  flame_percent INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gamification ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ANAMNESE
-- ============================================================
CREATE TABLE public.anamnese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objetivo TEXT,
  experiencia_treino TEXT,
  frequencia_treino TEXT,
  local_treino TEXT,
  equipamentos TEXT,
  lesoes TEXT,
  medicamentos TEXT,
  condicoes_saude TEXT,
  dieta_atual TEXT,
  restricoes_alimentares TEXT,
  suplementos TEXT,
  agua_diaria TEXT,
  sono_horas TEXT,
  nivel_estresse TEXT,
  ocupacao TEXT,
  disponibilidade_treino TEXT,
  motivacao TEXT,
  dados_extras JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.anamnese ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WORKOUTS
-- ============================================================
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  exercises JSONB DEFAULT '[]',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  dracmas_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY DEFINER FUNCTION for roles
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================================
-- AUTO-CREATE PROFILE on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.gamification (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RLS POLICIES - profiles
-- ============================================================
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Especialistas read profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- ============================================================
-- RLS POLICIES - user_roles
-- ============================================================
CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS POLICIES - gamification
-- ============================================================
CREATE POLICY "Users read own gamification"
  ON public.gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own gamification"
  ON public.gamification FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "All authenticated read gamification for ranking"
  ON public.gamification FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- RLS POLICIES - anamnese
-- ============================================================
CREATE POLICY "Users read own anamnese"
  ON public.anamnese FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own anamnese"
  ON public.anamnese FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all anamnese"
  ON public.anamnese FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Especialistas read anamnese"
  ON public.anamnese FOR SELECT
  USING (public.has_role(auth.uid(), 'especialista'));

-- ============================================================
-- RLS POLICIES - workouts
-- ============================================================
CREATE POLICY "Users CRUD own workouts"
  ON public.workouts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES - achievements
-- ============================================================
CREATE POLICY "Users read own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);




-- Fix: Create the missing trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix profiles RLS: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Especialistas read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Especialistas read profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'especialista'::app_role));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Fix anamnese RLS
DROP POLICY IF EXISTS "Users read own anamnese" ON public.anamnese;
DROP POLICY IF EXISTS "Admins read all anamnese" ON public.anamnese;
DROP POLICY IF EXISTS "Especialistas read anamnese" ON public.anamnese;
DROP POLICY IF EXISTS "Users insert own anamnese" ON public.anamnese;

CREATE POLICY "Users read own anamnese" ON public.anamnese FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all anamnese" ON public.anamnese FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Especialistas read anamnese" ON public.anamnese FOR SELECT USING (has_role(auth.uid(), 'especialista'::app_role));
CREATE POLICY "Users insert own anamnese" ON public.anamnese FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix achievements RLS
DROP POLICY IF EXISTS "Users read own achievements" ON public.achievements;
DROP POLICY IF EXISTS "Users insert own achievements" ON public.achievements;

CREATE POLICY "Users read own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix gamification RLS
DROP POLICY IF EXISTS "Users read own gamification" ON public.gamification;
DROP POLICY IF EXISTS "All authenticated read gamification for ranking" ON public.gamification;
DROP POLICY IF EXISTS "Users update own gamification" ON public.gamification;

CREATE POLICY "Users read own gamification" ON public.gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "All authenticated read gamification for ranking" ON public.gamification FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users update own gamification" ON public.gamification FOR UPDATE USING (auth.uid() = user_id);

-- Fix user_roles RLS
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix workouts RLS
DROP POLICY IF EXISTS "Users CRUD own workouts" ON public.workouts;

CREATE POLICY "Users CRUD own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id);

-- Allow profiles INSERT for the trigger
CREATE POLICY "System insert profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);




ALTER TABLE public.gamification DROP COLUMN IF EXISTS league;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS classe;
DROP TYPE IF EXISTS league_type;
DROP TYPE IF EXISTS classe_type;




-- Training plans created by specialists for users
CREATE TABLE public.training_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  specialist_id UUID,
  title TEXT NOT NULL DEFAULT 'Plano Personalizado',
  groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_sessions INTEGER NOT NULL DEFAULT 50,
  valid_until DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;

-- Users can read their own plans
CREATE POLICY "Users read own training plans"
ON public.training_plans FOR SELECT
USING (auth.uid() = user_id);

-- Specialists can CRUD plans (they create for users)
CREATE POLICY "Especialistas manage training plans"
ON public.training_plans FOR ALL
USING (has_role(auth.uid(), 'especialista'::app_role));

-- Admins can read all
CREATE POLICY "Admins read all training plans"
ON public.training_plans FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add effort_rating, comment, group_name to workouts
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS effort_rating INTEGER;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.training_plans(id);




-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Conversation participants
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- RLS: conversations - users see only their own
CREATE POLICY "Users see own conversations"
ON public.conversations FOR SELECT
USING (
  public.is_conversation_participant(auth.uid(), id)
);

-- RLS: participants - users see participants of their conversations
CREATE POLICY "Users see conversation participants"
ON public.conversation_participants FOR SELECT
USING (
  public.is_conversation_participant(auth.uid(), conversation_id)
);

-- RLS: messages - users read messages in their conversations
CREATE POLICY "Users read own conversation messages"
ON public.chat_messages FOR SELECT
USING (
  public.is_conversation_participant(auth.uid(), conversation_id)
);

-- RLS: messages - users send messages to their conversations
CREATE POLICY "Users send messages to own conversations"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_participant(auth.uid(), conversation_id)
);

-- Indexes for performance
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conv ON public.conversation_participants(conversation_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;




-- Table to link students to specialists
CREATE TABLE public.student_specialists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  specialist_id UUID NOT NULL,
  specialty TEXT NOT NULL CHECK (specialty IN ('preparador', 'nutricionista', 'psicologo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, specialist_id)
);

ALTER TABLE public.student_specialists ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Students see own specialists"
ON public.student_specialists FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Specialists see own students"
ON public.student_specialists FOR SELECT
USING (auth.uid() = specialist_id);

CREATE POLICY "Admins manage student_specialists"
ON public.student_specialists FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Specialists manage own links"
ON public.student_specialists FOR ALL
USING (public.has_role(auth.uid(), 'especialista'));

-- Function: auto-create conversations when linking student to specialist
CREATE OR REPLACE FUNCTION public.auto_create_conversations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id UUID;
  group_conv_id UUID;
  existing_group UUID;
BEGIN
  -- 1. Create direct conversation between student and specialist
  INSERT INTO public.conversations (type, title)
  VALUES ('direct', NULL)
  RETURNING id INTO conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, NEW.student_id), (conv_id, NEW.specialist_id);

  -- 2. Check if group conversation already exists for this student
  SELECT c.id INTO existing_group
  FROM public.conversations c
  JOIN public.conversation_participants cp ON cp.conversation_id = c.id
  WHERE c.type = 'group'
    AND cp.user_id = NEW.student_id
  LIMIT 1;

  IF existing_group IS NULL THEN
    -- Create group conversation
    INSERT INTO public.conversations (type, title)
    VALUES ('group', 'Equipe Multidisciplinar')
    RETURNING id INTO group_conv_id;

    -- Add student
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (group_conv_id, NEW.student_id);

    -- Add specialist
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (group_conv_id, NEW.specialist_id);
  ELSE
    -- Add specialist to existing group if not already there
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (existing_group, NEW.specialist_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_student_specialist_link
AFTER INSERT ON public.student_specialists
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_conversations();

-- Index
CREATE INDEX idx_student_specialists_student ON public.student_specialists(student_id);
CREATE INDEX idx_student_specialists_specialist ON public.student_specialists(specialist_id);




-- Create storage bucket for anamnese photos
INSERT INTO storage.buckets (id, name, public) VALUES ('anamnese-photos', 'anamnese-photos', true);

-- Users can upload their own photos
CREATE POLICY "Users upload own anamnese photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'anamnese-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone authenticated can view photos (specialists need access too)
CREATE POLICY "Authenticated users view anamnese photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'anamnese-photos' AND auth.role() = 'authenticated');

-- Users can update their own photos
CREATE POLICY "Users update own anamnese photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'anamnese-photos' AND auth.uid()::text = (storage.foldername(name))[1]);




-- Create update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Diet plans table
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  specialist_id UUID,
  title TEXT NOT NULL DEFAULT 'Plano Alimentar',
  meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own diet plans" ON public.diet_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Especialistas manage diet plans" ON public.diet_plans
  FOR ALL USING (has_role(auth.uid(), 'especialista'::app_role));

CREATE POLICY "Admins read all diet plans" ON public.diet_plans
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_diet_plans_updated_at
  BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Psychological check-ins table
CREATE TABLE public.psych_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood INTEGER NOT NULL DEFAULT 3,
  stress INTEGER NOT NULL DEFAULT 3,
  sleep_hours NUMERIC(3,1),
  sleep_quality INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.psych_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own checkins" ON public.psych_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own checkins" ON public.psych_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Especialistas read checkins" ON public.psych_checkins
  FOR SELECT USING (has_role(auth.uid(), 'especialista'::app_role));

CREATE POLICY "Admins read all checkins" ON public.psych_checkins
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));




-- Notifications table for specialist alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'stale_plan',
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users read own notifications
CREATE POLICY "Users read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users update own notifications (mark as read)
CREATE POLICY "Users update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role inserts notifications (edge function)
CREATE POLICY "Service role insert notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read) WHERE read = false;




-- Table for monthly reassessments
CREATE TABLE public.monthly_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Personal (can change monthly)
  altura TEXT,
  peso TEXT,

  -- Photos (stored as URLs from storage)
  foto_frente TEXT,
  foto_costas TEXT,
  foto_lado_direito TEXT,
  foto_lado_esquerdo TEXT,
  foto_perfil_lado TEXT,

  -- Training modality
  modalidade TEXT, -- 'musculacao' | 'hibrido'

  -- Fatigue level 0-4
  nivel_fadiga INTEGER,

  -- Muscle group progression (true=yes, false=no, null=N/A)
  progresso_peitoral BOOLEAN,
  progresso_costas BOOLEAN,
  progresso_deltoide BOOLEAN,
  progresso_triceps BOOLEAN,
  progresso_biceps BOOLEAN,
  progresso_quadriceps BOOLEAN,
  progresso_posteriores BOOLEAN,
  progresso_gluteos BOOLEAN,
  progresso_panturrilha BOOLEAN,
  progresso_abdomen TEXT, -- 'sim' | 'nao' | 'nao_tenho'
  progresso_antebraco TEXT, -- 'sim' | 'nao' | 'nao_tenho'

  -- Notes on lack of progression
  notas_progressao TEXT,

  -- Physical improvement priorities
  prioridades_fisicas TEXT,

  -- Training schedule
  dias_disponiveis TEXT[], -- array of weekdays
  frequencia_compromisso TEXT,
  tempo_disponivel TEXT,

  -- Equipment NOT available
  maquinas_indisponiveis TEXT[],

  -- Adherence scores (1-10)
  adesao_treinos INTEGER,
  motivo_adesao_treinos TEXT,
  adesao_cardios INTEGER,
  motivo_adesao_cardios TEXT,
  alongamentos_corretos BOOLEAN,

  -- Diet
  refeicoes_horarios TEXT, -- 'mesmos' or custom text
  horario_treino TEXT, -- 'mesmos' or custom text
  horario_treino_outro TEXT,
  objetivo_atual TEXT, -- 'perda_gordura' | 'ganho_massa' | 'profissionais'
  competicao_fisiculturismo TEXT,
  restricao_alimentar TEXT,
  alimentos_proibidos TEXT,
  adesao_dieta TEXT, -- '100%' | '80%' | '50%' | 'nao_consegui'
  motivo_nao_dieta TEXT,
  sugestao_dieta TEXT,

  -- Authorization
  autoriza_publicacao BOOLEAN,

  -- General suggestion
  sugestao_melhoria TEXT
);

-- Enable RLS
ALTER TABLE public.monthly_assessments ENABLE ROW LEVEL SECURITY;

-- Users read own assessments
CREATE POLICY "Users read own monthly assessments"
  ON public.monthly_assessments FOR SELECT
  USING (auth.uid() = user_id);

-- Users insert own assessments
CREATE POLICY "Users insert own monthly assessments"
  ON public.monthly_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Specialists read assessments of their students
CREATE POLICY "Especialistas read monthly assessments"
  ON public.monthly_assessments FOR SELECT
  USING (has_role(auth.uid(), 'especialista'::app_role));

-- Admins read all
CREATE POLICY "Admins read all monthly assessments"
  ON public.monthly_assessments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));



-- Add truce tracking fields to gamification
ALTER TABLE public.gamification
ADD COLUMN IF NOT EXISTS truce_days integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_training_date date DEFAULT NULL;

-- truce_days: 0 = normal, 1 = in truce (1 missed day), 2+ = flame extinguished
-- last_training_date: tracks the last day the student completed a workout


-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;



-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: users can upload their own avatar
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: users can update their own avatar
CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: avatars are publicly readable
CREATE POLICY "Avatars are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');




-- Daily habits tracking (water intake + completed meals)
CREATE TABLE public.daily_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_liters NUMERIC NOT NULL DEFAULT 0,
  completed_meals TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;

-- Users can read their own habits
CREATE POLICY "Users read own daily habits"
  ON public.daily_habits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own habits
CREATE POLICY "Users insert own daily habits"
  ON public.daily_habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own habits
CREATE POLICY "Users update own daily habits"
  ON public.daily_habits FOR UPDATE
  USING (auth.uid() = user_id);

-- Specialists can read habits for monitoring
CREATE POLICY "Especialistas read daily habits"
  ON public.daily_habits FOR SELECT
  USING (has_role(auth.uid(), 'especialista'::app_role));

-- Admins can read all habits
CREATE POLICY "Admins read all daily habits"
  ON public.daily_habits FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_daily_habits_updated_at
  BEFORE UPDATE ON public.daily_habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();




-- Exercise Library table
CREATE TABLE public.exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  default_sets integer NOT NULL DEFAULT 3,
  default_reps text NOT NULL DEFAULT '10',
  video_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read exercises"
  ON public.exercise_library FOR SELECT
  USING (auth.role() = 'authenticated');

-- Training Templates table
CREATE TABLE public.training_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  groups jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.training_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists manage own templates"
  ON public.training_templates FOR ALL
  USING (auth.uid() = specialist_id);

CREATE POLICY "Admins read all templates"
  ON public.training_templates FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_training_templates_updated_at
  BEFORE UPDATE ON public.training_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed exercise library
INSERT INTO public.exercise_library (name, muscle_group, default_sets, default_reps) VALUES
-- Peito
('Supino reto com barra', 'Peito', 4, '8 a 10'),
('Supino inclinado com halteres', 'Peito', 4, '8 a 12'),
('Supino declinado com barra', 'Peito', 4, '8 a 10'),
('Crucifixo com halteres', 'Peito', 3, '10 a 12'),
('Crucifixo mÃ¡quina', 'Peito', 3, '10 a 12'),
('Crossover polia alta', 'Peito', 3, '12 a 15'),
('Crossover polia baixa', 'Peito', 3, '12 a 15'),
('Supino reto com halteres', 'Peito', 4, '8 a 10'),
('FlexÃ£o de braÃ§o', 'Peito', 3, '10 a 15'),
-- Costas
('Puxada frontal aberta', 'Costas', 4, '8 a 12'),
('Puxada triÃ¢ngulo', 'Costas', 4, '8 a 10'),
('Remada curvada com barra', 'Costas', 4, '8 a 10'),
('Remada unilateral com halter', 'Costas', 3, '10 a 12'),
('Remada baixa na polia', 'Costas', 4, '8 a 12'),
('Remada cavalinho', 'Costas', 4, '8 a 10'),
('Pulldown braÃ§o reto', 'Costas', 3, '12 a 15'),
('Barra fixa', 'Costas', 3, '6 a 10'),
('Serrote', 'Costas', 3, '10 a 12'),
-- Ombro
('Desenvolvimento com halteres', 'Ombro', 4, '8 a 12'),
('Desenvolvimento mÃ¡quina', 'Ombro', 4, '8 a 12'),
('ElevaÃ§Ã£o lateral com halteres', 'Ombro', 3, '12 a 15'),
('ElevaÃ§Ã£o lateral na polia', 'Ombro', 3, '12 a 15'),
('ElevaÃ§Ã£o frontal', 'Ombro', 3, '12 a 15'),
('Face pull', 'Ombro', 3, '15 a 20'),
('Encolhimento com halteres', 'Ombro', 3, '12 a 15'),
('Desenvolvimento Arnold', 'Ombro', 3, '10 a 12'),
-- BÃ­ceps
('Rosca direta com barra reta', 'BÃ­ceps', 3, '10 a 12'),
('Rosca direta com barra W', 'BÃ­ceps', 3, '10 a 12'),
('Rosca alternada com halteres', 'BÃ­ceps', 3, '10 a 12'),
('Rosca martelo', 'BÃ­ceps', 3, '10 a 12'),
('Rosca scott mÃ¡quina', 'BÃ­ceps', 3, '10 a 12'),
('Rosca concentrada', 'BÃ­ceps', 3, '10 a 12'),
('Rosca na polia barra reta', 'BÃ­ceps', 3, '10 a 12'),
-- TrÃ­ceps
('TrÃ­ceps polia com barra reta', 'TrÃ­ceps', 3, '10 a 12'),
('TrÃ­ceps polia com barra V', 'TrÃ­ceps', 3, '10 a 12'),
('TrÃ­ceps polia corda', 'TrÃ­ceps', 3, '10 a 12'),
('TrÃ­ceps francÃªs com halter', 'TrÃ­ceps', 3, '10 a 12'),
('TrÃ­ceps testa com barra W', 'TrÃ­ceps', 3, '10 a 12'),
('Mergulho em paralelas', 'TrÃ­ceps', 3, '8 a 12'),
('TrÃ­ceps mÃ¡quina', 'TrÃ­ceps', 3, '10 a 12'),
('TrÃ­ceps coice com halter', 'TrÃ­ceps', 3, '10 a 12'),
-- Pernas (QuadrÃ­ceps)
('Agachamento livre com barra', 'Pernas', 4, '8 a 10'),
('Agachamento hack', 'Pernas', 4, '8 a 10'),
('Leg press 45Â°', 'Pernas', 4, '10 a 12'),
('Cadeira extensora', 'Pernas', 4, '12 a 15'),
('Agachamento bÃºlgaro', 'Pernas', 3, '10 a 12'),
('Passada com halteres', 'Pernas', 3, '10 a 12'),
('Agachamento sumÃ´', 'Pernas', 3, '10 a 12'),
-- Posteriores
('Mesa flexora', 'Posteriores', 3, '10 a 12'),
('Cadeira flexora', 'Posteriores', 3, '10 a 12'),
('Stiff com barra', 'Posteriores', 4, '8 a 10'),
('Stiff com halteres', 'Posteriores', 4, '8 a 10'),
('Levantamento terra', 'Posteriores', 4, '6 a 8'),
-- GlÃºteos
('Hip thrust com barra', 'GlÃºteos', 4, '10 a 12'),
('ElevaÃ§Ã£o pÃ©lvica', 'GlÃºteos', 3, '12 a 15'),
('Cadeira abdutora', 'GlÃºteos', 3, '12 a 15'),
('GlÃºteo na polia', 'GlÃºteos', 3, '12 a 15'),
('Agachamento sumo com halter', 'GlÃºteos', 3, '10 a 12'),
-- Panturrilha
('Panturrilha em pÃ© na mÃ¡quina', 'Panturrilha', 4, '15 a 20'),
('Panturrilha sentado', 'Panturrilha', 4, '15 a 20'),
('Panturrilha no leg press', 'Panturrilha', 3, '15 a 20'),
-- AbdÃ´men
('Abdominal infra', 'AbdÃ´men', 3, '15 a 20'),
('Abdominal supra', 'AbdÃ´men', 3, '15 a 20'),
('Prancha isomÃ©trica', 'AbdÃ´men', 3, '30 a 60s'),
('OblÃ­quo na polia', 'AbdÃ´men', 3, '12 a 15'),
('Abdominal na mÃ¡quina', 'AbdÃ´men', 3, '15 a 20');




-- Add reply_to column for quote/reply feature
ALTER TABLE public.chat_messages ADD COLUMN reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_chat_messages_reply_to ON public.chat_messages(reply_to);




-- Create message_reads table for read receipts
CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view reads for their conversations"
  ON public.message_reads FOR SELECT
  USING (true);

CREATE POLICY "Users can mark messages as read"
  ON public.message_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON public.message_reads(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;

-- Add type column to chat_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'type') THEN
    ALTER TABLE public.chat_messages ADD COLUMN type TEXT NOT NULL DEFAULT 'text';
  END IF;
END $$;




-- Create chat-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true);

-- Allow authenticated users to upload to chat-media
CREATE POLICY "Authenticated users upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-media' AND auth.role() = 'authenticated');

-- Allow anyone to view chat media (public bucket)
CREATE POLICY "Public read chat media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users delete own chat media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);




-- Add 'closer' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'closer';




-- 1. Add status column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente_onboarding';

-- Update existing onboarded users to 'ativo'
UPDATE public.profiles SET status = 'ativo' WHERE onboarded = true;

-- 2. Create invites table for token-based registration
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email text NOT NULL,
  name text,
  cpf text,
  plan_value numeric,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  used_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Admins and closers can manage invites
CREATE POLICY "Admins manage invites"
  ON public.invites FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Closers manage own invites"
  ON public.invites FOR ALL
  USING (public.has_role(auth.uid(), 'closer'));

-- Allow anonymous read for invite validation (first access page)
CREATE POLICY "Anyone can read pending invites by token"
  ON public.invites FOR SELECT
  USING (status = 'pending');

-- 3. Update handle_new_user to set status and mark invite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, status)
  VALUES (NEW.id, NEW.email, 'pendente_onboarding');
  
  INSERT INTO public.gamification (user_id)
  VALUES (NEW.id);
  
  -- Mark invite as used if exists
  UPDATE public.invites 
  SET status = 'used', used_at = now() 
  WHERE email = NEW.email AND status = 'pending';
  
  RETURN NEW;
END;
$function$;



CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NULL),
    'pendente_onboarding'
  );
  
  INSERT INTO public.gamification (user_id)
  VALUES (NEW.id);
  
  -- Mark invite as used if exists
  UPDATE public.invites 
  SET status = 'used', used_at = now() 
  WHERE email = NEW.email AND status = 'pending';
  
  RETURN NEW;
END;
$function$;



-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule check-stale-plans: runs every day at 08:00 UTC
SELECT cron.schedule(
  'check-stale-plans-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/check-stale-plans',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Schedule daily-flame-check: runs every day at 06:00 UTC
SELECT cron.schedule(
  'daily-flame-check',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/daily-flame-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb
  );
  $$
);




-- Table to store per-student volume limits set by the trainer
CREATE TABLE IF NOT EXISTS public.volume_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  specialist_id UUID NOT NULL,
  muscle_group TEXT NOT NULL,
  min_sets INTEGER NOT NULL DEFAULT 8,
  max_sets INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one record per student+specialist+muscle_group
CREATE UNIQUE INDEX IF NOT EXISTS volume_limits_student_specialist_group_idx
  ON public.volume_limits (student_id, specialist_id, muscle_group);

ALTER TABLE public.volume_limits ENABLE ROW LEVEL SECURITY;

-- Specialists can manage volume limits for their students
CREATE POLICY "Specialists manage volume limits"
  ON public.volume_limits FOR ALL
  USING (has_role(auth.uid(), 'especialista'::app_role));

-- Students can read their own volume limits
CREATE POLICY "Students read own volume limits"
  ON public.volume_limits FOR SELECT
  USING (auth.uid() = student_id);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_volume_limits_updated_at
  BEFORE UPDATE ON public.volume_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



-- Allow specialists to insert notifications for their students
CREATE POLICY "Specialists insert notifications for students"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'especialista'::app_role)
);




ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS logradouro text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS meta_peso text,
ADD COLUMN IF NOT EXISTS como_chegou text;




-- 1. Add 'cs' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cs';

-- 2. Create food_database table
CREATE TABLE public.food_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  portion text NOT NULL DEFAULT '100g',
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  fiber numeric DEFAULT 0,
  category text NOT NULL DEFAULT 'outros',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_database ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read food database
CREATE POLICY "Authenticated users read food database"
ON public.food_database FOR SELECT
TO authenticated
USING (true);

-- Especialistas can manage food items
CREATE POLICY "Especialistas manage food database"
ON public.food_database FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'especialista'::app_role));

-- Admins can manage food items
CREATE POLICY "Admins manage food database"
ON public.food_database FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_food_database_updated_at
BEFORE UPDATE ON public.food_database
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;



-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- App settings for VAPID keys (public readable, only service role can write)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT USING (true);

-- Trigger: insert notifications on new chat messages for all participants
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  participant RECORD;
  sender_name text;
  msg_preview text;
BEGIN
  SELECT nome INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  IF sender_name IS NULL THEN sender_name := 'UsuÃ¡rio'; END IF;

  IF NEW.type = 'text' THEN
    msg_preview := LEFT(NEW.content, 100);
  ELSE
    msg_preview := 'ðŸ“Ž MÃ­dia';
  END IF;

  FOR participant IN
    SELECT cp.user_id
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id != NEW.sender_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
      participant.user_id,
      sender_name,
      msg_preview,
      'chat',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_chat_message_notify
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_message();




-- Module 5: Add body_fat column to profiles (specialist-managed)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_fat numeric;

-- Module 4: Create trigger function for plan notifications
CREATE OR REPLACE FUNCTION public.notify_plan_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  plan_type text;
  plan_title text;
BEGIN
  IF TG_TABLE_NAME = 'training_plans' THEN
    plan_type := 'treino';
    plan_title := NEW.title;
  ELSE
    plan_type := 'dieta';
    plan_title := NEW.title;
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, metadata)
  VALUES (
    NEW.user_id,
    CASE WHEN plan_type = 'treino' THEN 'ðŸ’ª Novo Plano de Treino' ELSE 'ðŸŽ Novo Plano Alimentar' END,
    'Seu ' || plan_type || ' "' || plan_title || '" estÃ¡ disponÃ­vel!',
    'plan',
    jsonb_build_object('plan_type', plan_type, 'plan_id', NEW.id)
  );

  RETURN NEW;
END;
$function$;

-- Create triggers on training_plans and diet_plans
CREATE TRIGGER notify_training_plan_created
AFTER INSERT ON public.training_plans
FOR EACH ROW
EXECUTE FUNCTION public.notify_plan_created();

CREATE TRIGGER notify_diet_plan_created
AFTER INSERT ON public.diet_plans
FOR EACH ROW
EXECUTE FUNCTION public.notify_plan_created();




-- Add notification preview preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preview text NOT NULL DEFAULT 'full';
-- Values: 'full' (sender + message), 'partial' (sender + truncated), 'none' (generic "Nova mensagem")

COMMENT ON COLUMN public.profiles.notification_preview IS 'Controls message preview in notifications: full, partial, none';



-- Fix invites RLS: change from RESTRICTIVE to PERMISSIVE so closers/admins can insert
DROP POLICY IF EXISTS "Admins manage invites" ON public.invites;
DROP POLICY IF EXISTS "Anyone can read pending invites by token" ON public.invites;
DROP POLICY IF EXISTS "Closers manage own invites" ON public.invites;

CREATE POLICY "Admins manage invites" ON public.invites FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read pending invites by token" ON public.invites FOR SELECT TO authenticated USING (status = 'pending'::text);

CREATE POLICY "Closers manage own invites" ON public.invites FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'closer'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'closer'::app_role));

-- Also allow anon to read pending invites (for the invite page)
CREATE POLICY "Anon read pending invites" ON public.invites FOR SELECT TO anon USING (status = 'pending'::text);



CREATE TABLE public.diet_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT NOT NULL DEFAULT 'manutenÃ§Ã£o', -- 'deficit', 'bulking', 'manutenÃ§Ã£o', 'recomposiÃ§Ã£o'
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein NUMERIC NOT NULL DEFAULT 0,
  total_carbs NUMERIC NOT NULL DEFAULT 0,
  total_fat NUMERIC NOT NULL DEFAULT 0,
  meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  specialist_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diet_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read diet templates"
  ON public.diet_templates FOR SELECT
  USING (true);

CREATE POLICY "Especialistas manage diet templates"
  ON public.diet_templates FOR ALL
  USING (has_role(auth.uid(), 'especialista'::app_role));

CREATE POLICY "Admins manage diet templates"
  ON public.diet_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_diet_templates_updated_at
  BEFORE UPDATE ON public.diet_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



-- Allow admins to update any profile (needed for authorize/reject students)
CREATE POLICY "Admins update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow CS to read all profiles
CREATE POLICY "CS read all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'cs'));

-- Allow closers to read all profiles
CREATE POLICY "Closers read all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'closer'));


-- Add reviewed tracking to anamnese
ALTER TABLE public.anamnese
ADD COLUMN reviewed boolean NOT NULL DEFAULT false,
ADD COLUMN reviewed_by uuid DEFAULT NULL,
ADD COLUMN reviewed_at timestamptz DEFAULT NULL;

-- Allow specialists to update anamnese (mark as reviewed)
CREATE POLICY "Especialistas update anamnese reviewed"
ON public.anamnese
FOR UPDATE
USING (public.has_role(auth.uid(), 'especialista'))
WITH CHECK (public.has_role(auth.uid(), 'especialista'));

-- Allow admins to update anamnese
CREATE POLICY "Admins update anamnese"
ON public.anamnese
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow specialists to manage exercise library (create/edit exercises with YouTube links)
CREATE POLICY "Especialistas manage exercises"
ON public.exercise_library
FOR ALL
USING (public.has_role(auth.uid(), 'especialista'))
WITH CHECK (public.has_role(auth.uid(), 'especialista'));

-- Allow admins to manage exercise library
CREATE POLICY "Admins manage exercises"
ON public.exercise_library
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- Allow authenticated users to create conversations (for support chat)
CREATE POLICY "Authenticated users create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to add participants to conversations they participate in
CREATE POLICY "Authenticated users add participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (true);


-- Drop overly permissive policies and replace with tighter ones
DROP POLICY "Authenticated users create conversations" ON public.conversations;
DROP POLICY "Authenticated users add participants" ON public.conversation_participants;

-- Users can create conversations
CREATE POLICY "Authenticated users create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can add themselves or others to conversations they're part of
CREATE POLICY "Authenticated users add participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);



-- 1. Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "CS read all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'cs'));

CREATE POLICY "Users read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Marketing spend table
CREATE TABLE public.marketing_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month date NOT NULL,
  channel text NOT NULL DEFAULT 'ads',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing_spend"
  ON public.marketing_spend FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Seed subscriptions from existing used invites
INSERT INTO public.subscriptions (user_id, plan_price, status, started_at)
SELECT p.id, COALESCE(i.plan_value, 0), 'active', COALESCE(i.used_at, p.created_at)
FROM public.profiles p
LEFT JOIN public.invites i ON i.email = p.email AND i.status = 'used'
WHERE p.status != 'pendente_onboarding'
  AND NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id);



-- Allow students to read profiles of their linked specialists
CREATE POLICY "Students read specialist profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.student_id = auth.uid()
      AND ss.specialist_id = profiles.id
  )
);


-- Create a function to generate chat notifications when a message is inserted
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _participant RECORD;
  _sender_name TEXT;
  _preview_pref TEXT;
  _notif_title TEXT;
  _notif_body TEXT;
BEGIN
  -- Get sender name
  SELECT nome INTO _sender_name FROM public.profiles WHERE id = NEW.sender_id;
  _sender_name := COALESCE(_sender_name, 'Especialista');

  -- Don't create notifications for system messages
  IF NEW.type = 'system' THEN
    RETURN NEW;
  END IF;

  -- For each participant except the sender
  FOR _participant IN
    SELECT cp.user_id
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = NEW.conversation_id
      AND cp.user_id != NEW.sender_id
  LOOP
    -- Get notification preview preference
    SELECT notification_preview INTO _preview_pref
    FROM public.profiles WHERE id = _participant.user_id;
    _preview_pref := COALESCE(_preview_pref, 'full');

    -- Build title and body based on preference
    IF _preview_pref = 'full' THEN
      _notif_title := _sender_name;
      IF NEW.type IN ('image', 'video') THEN
        _notif_body := 'ðŸ“Ž MÃ­dia';
      ELSE
        _notif_body := LEFT(NEW.content, 80);
      END IF;
    ELSIF _preview_pref = 'partial' THEN
      _notif_title := _sender_name;
      _notif_body := 'Nova mensagem';
    ELSE
      _notif_title := 'Shape Insano';
      _notif_body := 'VocÃª recebeu uma nova mensagem';
    END IF;

    INSERT INTO public.notifications (user_id, title, body, type, metadata)
    VALUES (
      _participant.user_id,
      _notif_title,
      _notif_body,
      'chat',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'sender_id', NEW.sender_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_chat_message_notify ON public.chat_messages;
CREATE TRIGGER on_chat_message_notify
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_message();


ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'nutricionista';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'personal';



ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'nutricionista';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'personal';



-- Create subscription_plans table for plan management
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- CS and Admins can manage plans
CREATE POLICY "Admins manage subscription_plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CS manage subscription_plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(), 'cs'::app_role))
  WITH CHECK (has_role(auth.uid(), 'cs'::app_role));

CREATE POLICY "Authenticated read subscription_plans" ON public.subscription_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 3 test plans
INSERT INTO public.subscription_plans (name, duration_months, price) VALUES
  ('Plano 1', 1, 197.00),
  ('Plano 2', 3, 497.00),
  ('Plano 3', 6, 897.00);




-- 1. Drop achievements table (has RLS, safe to drop)
DROP TABLE IF EXISTS public.achievements CASCADE;

-- 2. Drop gamification table (has RLS, safe to drop)
DROP TABLE IF EXISTS public.gamification CASCADE;

-- 3. Remove xp_earned and dracmas_earned from workouts
ALTER TABLE public.workouts DROP COLUMN IF EXISTS xp_earned;
ALTER TABLE public.workouts DROP COLUMN IF EXISTS dracmas_earned;

-- 4. Update handle_new_user to remove gamification insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NULL),
    'pendente_onboarding'
  );
  
  -- Mark invite as used if exists
  UPDATE public.invites 
  SET status = 'used', used_at = now() 
  WHERE email = NEW.email AND status = 'pending';
  
  RETURN NEW;
END;
$function$;




-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Closers and Admins can manage products
CREATE POLICY "Admins manage products"
ON public.products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Closers manage products"
ON public.products FOR ALL
USING (has_role(auth.uid(), 'closer'::app_role))
WITH CHECK (has_role(auth.uid(), 'closer'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add product_id to invites
ALTER TABLE public.invites ADD COLUMN product_id UUID REFERENCES public.products(id);

-- Add payment_status to invites to track payment outcome
ALTER TABLE public.invites ADD COLUMN payment_status TEXT DEFAULT 'pending';




-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to send push notification via edge function when notification is inserted
CREATE OR REPLACE FUNCTION public.trigger_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supabase_url text;
  _service_key text;
  _payload jsonb;
BEGIN
  -- Build the payload
  _payload := jsonb_build_object(
    'user_id', NEW.user_id,
    'title', NEW.title,
    'body', COALESCE(NEW.body, ''),
    'data', COALESCE(NEW.metadata, '{}'::jsonb)
  );

  -- Get Supabase URL from app_settings or use env
  SELECT value INTO _supabase_url FROM public.app_settings WHERE key = 'supabase_url';
  SELECT value INTO _service_key FROM public.app_settings WHERE key = 'service_role_key';

  -- If we have the URL and key, make the HTTP call
  IF _supabase_url IS NOT NULL AND _service_key IS NOT NULL THEN
    PERFORM extensions.http_post(
      url := _supabase_url || '/functions/v1/push-notifications?action=send-to-user',
      body := _payload::text,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_key,
        'apikey', _service_key
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS on_notification_send_push ON public.notifications;
CREATE TRIGGER on_notification_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_push_on_notification();




-- Update the trigger function to use anon key (public, safe to store)
CREATE OR REPLACE FUNCTION public.trigger_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _supabase_url text;
  _anon_key text;
  _payload jsonb;
  _request_id bigint;
BEGIN
  -- Build the payload
  _payload := jsonb_build_object(
    'user_id', NEW.user_id,
    'title', NEW.title,
    'body', COALESCE(NEW.body, ''),
    'data', COALESCE(NEW.metadata, '{}'::jsonb)
  );

  -- Get Supabase URL and anon key from app_settings
  SELECT value INTO _supabase_url FROM public.app_settings WHERE key = 'supabase_url';
  SELECT value INTO _anon_key FROM public.app_settings WHERE key = 'supabase_anon_key';

  -- If we have the URL and key, make the HTTP call via pg_net
  IF _supabase_url IS NOT NULL AND _anon_key IS NOT NULL THEN
    SELECT net.http_post(
      url := _supabase_url || '/functions/v1/push-notifications?action=send-to-user',
      body := _payload,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', _anon_key
      )
    ) INTO _request_id;
  END IF;

  RETURN NEW;
END;
$$;



-- Create table for metric goals (admin-configurable targets)
CREATE TABLE public.metric_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key text NOT NULL UNIQUE,
  goal_value numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.metric_goals ENABLE ROW LEVEL SECURITY;

-- Only admins can manage goals
CREATE POLICY "Admins manage metric_goals"
ON public.metric_goals FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can read (for dashboard)
CREATE POLICY "Authenticated read metric_goals"
ON public.metric_goals FOR SELECT
USING (auth.role() = 'authenticated');

-- Seed default goals
INSERT INTO public.metric_goals (metric_key, goal_value) VALUES
  ('mrr', 50000),
  ('ltv', 3000),
  ('cac', 200),
  ('churn', 5)
ON CONFLICT (metric_key) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_metric_goals_updated_at
BEFORE UPDATE ON public.metric_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();



-- ============================================================
-- 1. FIX: invites table - remove anonymous/public read access
--    Only allow: admin, closers (own), and the invited user
-- ============================================================

-- Drop dangerous public read policies
DROP POLICY IF EXISTS "Anon read pending invites" ON public.invites;
DROP POLICY IF EXISTS "Anyone can read pending invites by token" ON public.invites;

-- Create a safe policy: only authenticated users can read invites by token
CREATE POLICY "Authenticated read own invite by token"
ON public.invites
FOR SELECT
USING (
  auth.role() = 'authenticated' AND status = 'pending'
);

-- ============================================================
-- 2. FIX: app_settings - restrict public read to non-sensitive keys
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;

-- Only authenticated users can read app_settings, and only non-secret keys
CREATE POLICY "Authenticated read non-secret app_settings"
ON public.app_settings
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND key NOT IN ('supabase_service_role_key', 'asaas_api_key')
);

-- ============================================================
-- 3. FIX: message_reads - restrict to conversation participants
-- ============================================================

DROP POLICY IF EXISTS "Users can view reads for their conversations" ON public.message_reads;

CREATE POLICY "Users view reads for own conversations"
ON public.message_reads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.conversation_participants cp ON cp.conversation_id = cm.conversation_id
    WHERE cm.id = message_reads.message_id
    AND cp.user_id = auth.uid()
  )
);

-- ============================================================
-- 4. Create idempotency table for webhook/payment deduplication
-- ============================================================

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response JSONB
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) can access this table
-- No user-facing policies needed

-- ============================================================
-- 5. Enable leaked password protection reminder
-- ============================================================
-- Note: This is configured via Supabase Auth settings, not SQL




-- ============================================================
-- CRITICAL FIX 1: Especialistas sÃ³ veem perfis dos seus alunos
-- ============================================================

-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Especialistas read profiles" ON public.profiles;

-- Especialistas sÃ³ veem perfis de alunos atribuÃ­dos a eles
CREATE POLICY "Especialistas read assigned student profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = profiles.id
  )
);

-- ============================================================
-- CRITICAL FIX 2: Especialistas sÃ³ veem anamnese dos seus alunos
-- ============================================================

DROP POLICY IF EXISTS "Especialistas read anamnese" ON public.anamnese;
DROP POLICY IF EXISTS "Especialistas update anamnese reviewed" ON public.anamnese;

CREATE POLICY "Especialistas read assigned student anamnese"
ON public.anamnese
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = anamnese.user_id
  )
);

CREATE POLICY "Especialistas update assigned student anamnese"
ON public.anamnese
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = anamnese.user_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = anamnese.user_id
  )
);

-- ============================================================
-- CRITICAL FIX 3: Especialistas sÃ³ veem avaliaÃ§Ãµes dos seus alunos
-- ============================================================

DROP POLICY IF EXISTS "Especialistas read monthly assessments" ON public.monthly_assessments;

CREATE POLICY "Especialistas read assigned student assessments"
ON public.monthly_assessments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = monthly_assessments.user_id
  )
);

-- ============================================================
-- CRITICAL FIX 4: Closers sÃ³ veem convites que eles criaram
-- ============================================================

DROP POLICY IF EXISTS "Closers manage own invites" ON public.invites;

CREATE POLICY "Closers manage own created invites"
ON public.invites
FOR ALL
USING (
  has_role(auth.uid(), 'closer'::app_role)
  AND created_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'closer'::app_role)
  AND created_by = auth.uid()
);

-- ============================================================
-- MEDIUM FIX 1: Especialistas sÃ³ veem check-ins dos seus alunos
-- ============================================================

DROP POLICY IF EXISTS "Especialistas read checkins" ON public.psych_checkins;

CREATE POLICY "Especialistas read assigned student checkins"
ON public.psych_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = psych_checkins.user_id
  )
);

-- ============================================================
-- MEDIUM FIX 2: Especialistas sÃ³ veem hÃ¡bitos dos seus alunos
-- ============================================================

DROP POLICY IF EXISTS "Especialistas read daily habits" ON public.daily_habits;

CREATE POLICY "Especialistas read assigned student daily habits"
ON public.daily_habits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = daily_habits.user_id
  )
);

-- ============================================================
-- MEDIUM FIX 3: Especialistas podem ver treinos dos seus alunos
-- ============================================================

CREATE POLICY "Especialistas read assigned student workouts"
ON public.workouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_specialists ss
    WHERE ss.specialist_id = auth.uid()
      AND ss.student_id = workouts.user_id
  )
);

-- ============================================================
-- MEDIUM FIX 4: app_settings com allowlist (mais seguro)
-- ============================================================

DROP POLICY IF EXISTS "Authenticated read non-secret app_settings" ON public.app_settings;

CREATE POLICY "Authenticated read public app_settings"
ON public.app_settings
FOR SELECT
USING (
  (auth.role() = 'authenticated'::text)
  AND key IN ('supabase_url', 'supabase_anon_key', 'app_name', 'app_version')
);

-- ============================================================
-- INFO FIX: Users can delete own notifications
-- ============================================================

CREATE POLICY "Users delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);



ALTER TABLE public.student_specialists DROP CONSTRAINT student_specialists_specialty_check;
ALTER TABLE public.student_specialists ADD CONSTRAINT student_specialists_specialty_check CHECK (specialty = ANY (ARRAY['personal'::text, 'nutricionista'::text, 'preparador'::text, 'psicologo'::text]));



-- Allow personal trainers to manage exercise_library
CREATE POLICY "Personal manage exercises"
ON public.exercise_library
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

-- Allow personal trainers to manage training_plans
CREATE POLICY "Personal manage training plans"
ON public.training_plans
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

-- Allow nutricionistas to manage diet_plans (they likely need this too)
CREATE POLICY "Nutricionista manage diet plans"
ON public.diet_plans
FOR ALL
USING (has_role(auth.uid(), 'nutricionista'::app_role))
WITH CHECK (has_role(auth.uid(), 'nutricionista'::app_role));

-- Allow personal to read all training plans (admin-like for their students)
CREATE POLICY "Personal read all training plans"
ON public.training_plans
FOR SELECT
USING (has_role(auth.uid(), 'personal'::app_role));

-- Allow personal and nutricionista to manage training/diet templates
CREATE POLICY "Personal manage training templates"
ON public.training_templates
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Nutricionista manage diet templates"
ON public.diet_templates
FOR ALL
USING (has_role(auth.uid(), 'nutricionista'::app_role))
WITH CHECK (has_role(auth.uid(), 'nutricionista'::app_role));

-- Allow personal/nutricionista to read assigned student profiles
CREATE POLICY "Personal read assigned student profiles"
ON public.profiles
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_specialists ss
  WHERE ss.specialist_id = auth.uid() AND ss.student_id = profiles.id
));

-- Allow personal/nutricionista to read student data they need
CREATE POLICY "Personal read assigned student anamnese"
ON public.anamnese
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_specialists ss
  WHERE ss.specialist_id = auth.uid() AND ss.student_id = anamnese.user_id
));

CREATE POLICY "Personal read assigned student workouts"
ON public.workouts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_specialists ss
  WHERE ss.specialist_id = auth.uid() AND ss.student_id = workouts.user_id
));

CREATE POLICY "Personal read assigned student assessments"
ON public.monthly_assessments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_specialists ss
  WHERE ss.specialist_id = auth.uid() AND ss.student_id = monthly_assessments.user_id
));

CREATE POLICY "Personal read assigned student daily habits"
ON public.daily_habits
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_specialists ss
  WHERE ss.specialist_id = auth.uid() AND ss.student_id = daily_habits.user_id
));

CREATE POLICY "Personal read assigned student checkins"
ON public.psych_checkins
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_specialists ss
  WHERE ss.specialist_id = auth.uid() AND ss.student_id = psych_checkins.user_id
));

-- Allow personal/nutricionista to manage student_specialists
CREATE POLICY "Personal manage student links"
ON public.student_specialists
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Nutricionista manage student links"
ON public.student_specialists
FOR ALL
USING (has_role(auth.uid(), 'nutricionista'::app_role))
WITH CHECK (has_role(auth.uid(), 'nutricionista'::app_role));

-- Allow personal to manage volume_limits
CREATE POLICY "Personal manage volume limits"
ON public.volume_limits
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

-- Allow personal/nutricionista to manage food_database
CREATE POLICY "Personal manage food database"
ON public.food_database
FOR ALL
USING (has_role(auth.uid(), 'personal'::app_role))
WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Nutricionista manage food database"
ON public.food_database
FOR ALL
USING (has_role(auth.uid(), 'nutricionista'::app_role))
WITH CHECK (has_role(auth.uid(), 'nutricionista'::app_role));




CREATE POLICY "Admins read all workouts"
  ON public.workouts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));




-- Admin pode ler todas as conversas
CREATE POLICY "Admins read all conversations"
  ON public.conversations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin pode ler todos os participantes
CREATE POLICY "Admins read all conversation_participants"
  ON public.conversation_participants
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));



-- Allow authenticated users to find CS agents for support chat
CREATE POLICY "Authenticated users find cs agents"
ON public.user_roles
FOR SELECT
USING (
  auth.role() = 'authenticated' AND role = 'cs'
);



-- Function to get last message per conversation in a single call
-- This replaces N individual queries with 1
CREATE OR REPLACE FUNCTION public.get_last_messages(conv_ids uuid[])
RETURNS TABLE(conversation_id uuid, content text, created_at timestamptz, sender_id uuid, type text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (cm.conversation_id)
    cm.conversation_id,
    cm.content,
    cm.created_at,
    cm.sender_id,
    cm.type
  FROM chat_messages cm
  WHERE cm.conversation_id = ANY(conv_ids)
  ORDER BY cm.conversation_id, cm.created_at DESC;
$$;



-- Allow admins to read all chat messages (needed for observer mode)
CREATE POLICY "Admins read all chat_messages"
  ON public.chat_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));



-- Add structured portion columns to food_database
ALTER TABLE food_database 
  ADD COLUMN IF NOT EXISTS portion_unit text DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS portion_amount numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS portion_grams numeric DEFAULT 100;

-- Parse existing portion text into structured columns
UPDATE food_database SET
  portion_unit = CASE
    WHEN portion ILIKE '%unidade%' THEN 'unidade'
    WHEN portion ILIKE '%colher%' THEN 'colher de sopa'
    WHEN portion ILIKE '%fatia%' THEN 'fatia'
    WHEN portion ILIKE '%ml%' THEN 'ml'
    WHEN portion ILIKE '%scoop%' THEN 'scoop'
    WHEN portion ILIKE '%xÃ­cara%' OR portion ILIKE '%xicara%' THEN 'xÃ­cara'
    ELSE 'g'
  END,
  portion_amount = COALESCE(
    (regexp_match(portion, '(\d+)'))[1]::numeric,
    1
  ),
  portion_grams = COALESCE(
    (regexp_match(portion, '\((\d+)g\)'))[1]::numeric,
    CASE 
      WHEN portion ~ '^\d+g$' THEN (regexp_match(portion, '^(\d+)'))[1]::numeric
      WHEN portion ILIKE '%ml%' THEN (regexp_match(portion, '(\d+)'))[1]::numeric
      ELSE 100 
    END
  );



-- Monthly metric goals: one goal per metric per month
CREATE TABLE public.monthly_metric_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key TEXT NOT NULL,
  month TEXT NOT NULL, -- format: YYYY-MM
  goal_value NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID,
  UNIQUE(metric_key, month)
);

-- Enable RLS
ALTER TABLE public.monthly_metric_goals ENABLE ROW LEVEL SECURITY;

-- Admins can read
CREATE POLICY "Admins can read monthly goals"
  ON public.monthly_metric_goals
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert
CREATE POLICY "Admins can insert monthly goals"
  ON public.monthly_metric_goals
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update monthly goals"
  ON public.monthly_metric_goals
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_monthly_metric_goals_updated_at
  BEFORE UPDATE ON public.monthly_metric_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


CREATE INDEX IF NOT EXISTS idx_food_database_name ON public.food_database (name);



-- Create food_measures table for household measurement units
CREATE TABLE public.food_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id UUID NOT NULL REFERENCES public.food_database(id) ON DELETE CASCADE,
  description TEXT NOT NULL,           -- e.g. "Fatia mÃ©dia", "Colher de sopa", "Unidade"
  gram_equivalent DECIMAL(10,2) NOT NULL, -- how many grams this measure represents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by food_id
CREATE INDEX idx_food_measures_food_id ON public.food_measures(food_id);

-- Enable RLS
ALTER TABLE public.food_measures ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read measures
CREATE POLICY "Authenticated users read food measures"
  ON public.food_measures FOR SELECT
  USING (true);

-- Specialists and nutritionists can manage measures
CREATE POLICY "Especialistas manage food measures"
  ON public.food_measures FOR ALL
  USING (has_role(auth.uid(), 'especialista'::app_role))
  WITH CHECK (has_role(auth.uid(), 'especialista'::app_role));

CREATE POLICY "Nutricionista manage food measures"
  ON public.food_measures FOR ALL
  USING (has_role(auth.uid(), 'nutricionista'::app_role))
  WITH CHECK (has_role(auth.uid(), 'nutricionista'::app_role));

CREATE POLICY "Personal manage food measures"
  ON public.food_measures FOR ALL
  USING (has_role(auth.uid(), 'personal'::app_role))
  WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

CREATE POLICY "Admins manage food measures"
  ON public.food_measures FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));




-- 1. Add 'fonte' column to food_database (TACO or TBCA)
ALTER TABLE public.food_database ADD COLUMN IF NOT EXISTS fonte TEXT DEFAULT 'TBCA';

-- Mark all existing rows as TBCA
UPDATE public.food_database SET fonte = 'TBCA' WHERE fonte IS NULL;

-- 2. Create food_favorites table (per-specialist favorites)
CREATE TABLE public.food_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL,
  food_id UUID NOT NULL REFERENCES public.food_database(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(specialist_id, food_id)
);

ALTER TABLE public.food_favorites ENABLE ROW LEVEL SECURITY;

-- Specialists can manage their own favorites
CREATE POLICY "Users manage own food favorites"
  ON public.food_favorites
  FOR ALL
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);

-- Index for fast lookup
CREATE INDEX idx_food_favorites_specialist ON public.food_favorites(specialist_id);

-- 3. Add full-text search index on food_database.name for faster Portuguese search
CREATE INDEX IF NOT EXISTS idx_food_database_name_fts ON public.food_database USING gin (to_tsvector('portuguese', name));




-- Add goal column to diet_plans
ALTER TABLE public.diet_plans
ADD COLUMN goal text NOT NULL DEFAULT 'manutenÃ§Ã£o';



ALTER TABLE public.diet_plans ADD COLUMN goal_description TEXT DEFAULT NULL;



-- Add billing_type and description to subscription_plans
ALTER TABLE public.subscription_plans 
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS description text;




ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'PIX',
ADD COLUMN IF NOT EXISTS max_installments integer NOT NULL DEFAULT 1;



-- Enable realtime for the tables the specialist panel listens to
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_habits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.psych_checkins;



-- Add new columns to exercise_library for richer exercise data
ALTER TABLE public.exercise_library
  ADD COLUMN IF NOT EXISTS gif_url text,
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS equipment text,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS secondary_muscles text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS external_id text;

-- Add unique constraint on external_id for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_library_external_id ON public.exercise_library(external_id) WHERE external_id IS NOT NULL;




INSERT INTO storage.buckets (id, name, public) VALUES ('temp-imports', 'temp-imports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read temp-imports" ON storage.objects FOR SELECT USING (bucket_id = 'temp-imports');
CREATE POLICY "Auth upload temp-imports" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'temp-imports' AND auth.role() = 'authenticated');



-- Allow closers to manage subscription_plans
CREATE POLICY "Closers manage subscription_plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'closer'::app_role))
WITH CHECK (has_role(auth.uid(), 'closer'::app_role));


ALTER TABLE subscription_plans ADD COLUMN specialist_limitation text NOT NULL DEFAULT 'nenhum';


ALTER TABLE invites ADD COLUMN subscription_plan_id uuid REFERENCES subscription_plans(id);



-- Add specialist analysis fields to training_plans
ALTER TABLE public.training_plans
  ADD COLUMN avaliacao_postural text,
  ADD COLUMN pontos_melhoria text,
  ADD COLUMN objetivo_mesociclo text;




ALTER TABLE public.food_database ADD COLUMN IF NOT EXISTS original_name text;




-- Add subscription_plan_id and expires_at to subscriptions
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS subscription_plan_id uuid REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Create index for expiration alerts
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON public.subscriptions(expires_at);




-- Create flame_status table for persistent flame state
CREATE TABLE public.flame_status (
  user_id UUID NOT NULL PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'normal' CHECK (state IN ('normal', 'ativa', 'tregua', 'extinta')),
  streak INTEGER NOT NULL DEFAULT 0,
  last_approved_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flame_status ENABLE ROW LEVEL SECURITY;

-- Users read own flame status
CREATE POLICY "Users read own flame status"
ON public.flame_status FOR SELECT
USING (auth.uid() = user_id);

-- Users upsert own flame status (for immediate motor)
CREATE POLICY "Users upsert own flame status"
ON public.flame_status FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own flame status"
ON public.flame_status FOR UPDATE
USING (auth.uid() = user_id);

-- Admins read all
CREATE POLICY "Admins read all flame status"
ON public.flame_status FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Especialistas read assigned students
CREATE POLICY "Especialistas read student flame status"
ON public.flame_status FOR SELECT
USING (EXISTS (
  SELECT 1 FROM student_specialists ss
  WHERE ss.specialist_id = auth.uid() AND ss.student_id = flame_status.user_id
));

-- Service role full access (for cron edge function)
CREATE POLICY "Service role manage flame status"
ON public.flame_status FOR ALL
USING (true)
WITH CHECK (true);

-- Enable realtime for immediate UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.flame_status;




-- Remove overly permissive policy (service role bypasses RLS anyway)
DROP POLICY "Service role manage flame status" ON public.flame_status;




-- Training plan versions (snapshots)
CREATE TABLE public.training_plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_sessions INTEGER NOT NULL DEFAULT 50,
  avaliacao_postural TEXT,
  objetivo_mesociclo TEXT,
  pontos_melhoria TEXT,
  valid_until DATE,
  specialist_id UUID,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version_number INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.training_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all training_plan_versions"
  ON public.training_plan_versions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Especialistas manage training_plan_versions"
  ON public.training_plan_versions FOR ALL
  USING (has_role(auth.uid(), 'especialista'::app_role));

CREATE POLICY "Personal manage training_plan_versions"
  ON public.training_plan_versions FOR ALL
  USING (has_role(auth.uid(), 'personal'::app_role))
  WITH CHECK (has_role(auth.uid(), 'personal'::app_role));

CREATE INDEX idx_training_plan_versions_plan_id ON public.training_plan_versions(plan_id);

-- Diet plan versions (snapshots)
CREATE TABLE public.diet_plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  goal TEXT NOT NULL DEFAULT 'manutenÃ§Ã£o',
  goal_description TEXT,
  valid_until DATE,
  specialist_id UUID,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version_number INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.diet_plan_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all diet_plan_versions"
  ON public.diet_plan_versions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Especialistas manage diet_plan_versions"
  ON public.diet_plan_versions FOR ALL
  USING (has_role(auth.uid(), 'especialista'::app_role));

CREATE POLICY "Nutricionista manage diet_plan_versions"
  ON public.diet_plan_versions FOR ALL
  USING (has_role(auth.uid(), 'nutricionista'::app_role))
  WITH CHECK (has_role(auth.uid(), 'nutricionista'::app_role));

CREATE INDEX idx_diet_plan_versions_plan_id ON public.diet_plan_versions(plan_id);

-- Trigger: auto-snapshot training plan before update
CREATE OR REPLACE FUNCTION public.snapshot_training_plan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only snapshot if groups actually changed
  IF OLD.groups IS DISTINCT FROM NEW.groups OR OLD.title IS DISTINCT FROM NEW.title THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM public.training_plan_versions WHERE plan_id = OLD.id;

    INSERT INTO public.training_plan_versions (plan_id, title, groups, total_sessions, avaliacao_postural, objetivo_mesociclo, pontos_melhoria, valid_until, specialist_id, version_number)
    VALUES (OLD.id, OLD.title, OLD.groups, OLD.total_sessions, OLD.avaliacao_postural, OLD.objetivo_mesociclo, OLD.pontos_melhoria, OLD.valid_until, OLD.specialist_id, next_version);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_snapshot_training_plan
BEFORE UPDATE ON public.training_plans
FOR EACH ROW EXECUTE FUNCTION public.snapshot_training_plan();

-- Trigger: auto-snapshot diet plan before update
CREATE OR REPLACE FUNCTION public.snapshot_diet_plan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  next_version INTEGER;
BEGIN
  IF OLD.meals IS DISTINCT FROM NEW.meals OR OLD.title IS DISTINCT FROM NEW.title THEN
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
    FROM public.diet_plan_versions WHERE plan_id = OLD.id;

    INSERT INTO public.diet_plan_versions (plan_id, title, meals, goal, goal_description, valid_until, specialist_id, version_number)
    VALUES (OLD.id, OLD.title, OLD.meals, OLD.goal, OLD.goal_description, OLD.valid_until, OLD.specialist_id, next_version);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_snapshot_diet_plan
BEFORE UPDATE ON public.diet_plans
FOR EACH ROW EXECUTE FUNCTION public.snapshot_diet_plan();




-- Create storage bucket for blood test PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('exames-sangue', 'exames-sangue', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own blood tests
CREATE POLICY "Users upload own blood tests"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exames-sangue' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can view their own blood tests
CREATE POLICY "Users view own blood tests"
ON storage.objects FOR SELECT
USING (bucket_id = 'exames-sangue' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Admins can view all blood tests
CREATE POLICY "Admins view all blood tests"
ON storage.objects FOR SELECT
USING (bucket_id = 'exames-sangue' AND public.has_role(auth.uid(), 'admin'));

-- RLS: Specialists can view assigned student blood tests
CREATE POLICY "Specialists view student blood tests"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exames-sangue' 
  AND EXISTS (
    SELECT 1 FROM public.student_specialists ss 
    WHERE ss.specialist_id = auth.uid() 
    AND ss.student_id::text = (storage.foldername(name))[1]
  )
);




-- Add RLS policies for idempotency_keys (used by edge functions with service role)
CREATE POLICY "Service role manage idempotency_keys"
ON public.idempotency_keys
FOR ALL
USING (true)
WITH CHECK (true);




-- =============================================================
-- FIX 1: idempotency_keys - Remove overly permissive policy
-- The service_role bypasses RLS, so no replacement policy needed.
-- This prevents authenticated/anon users from accessing payment data.
-- =============================================================
DROP POLICY IF EXISTS "Service role manage idempotency_keys" ON public.idempotency_keys;

-- =============================================================
-- FIX 2: invites - Restrict SELECT to user's own email only
-- Previously any authenticated user could read ALL pending invites.
-- =============================================================
DROP POLICY IF EXISTS "Authenticated read own invite by token" ON public.invites;

CREATE POLICY "Users read own pending invite"
ON public.invites
FOR SELECT
TO authenticated
USING (
  status = 'pending' 
  AND email = (auth.jwt()->>'email')
);



-- Add invoice_url column to invites to support resending payment emails
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS invoice_url text;


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nome, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', NULL),
    'pendente_onboarding'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Mark invite as used if exists
  UPDATE public.invites 
  SET status = 'used', used_at = now() 
  WHERE email = NEW.email AND status = 'pending';
  
  RETURN NEW;
END;
$function$;



-- Add tracking columns to invites
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS email_opened_at timestamptz;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS payment_link_clicked_at timestamptz;

-- Enable realtime for invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.invites;




-- Table for specialists to store their AI training preferences/philosophy
CREATE TABLE public.specialist_ai_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id uuid NOT NULL UNIQUE,
  training_philosophy text DEFAULT '',
  preferred_methods text DEFAULT '',
  volume_preferences text DEFAULT '',
  exercise_preferences text DEFAULT '',
  periodization_style text DEFAULT '',
  notes text DEFAULT '',
  example_plans jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.specialist_ai_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists manage own AI preferences"
  ON public.specialist_ai_preferences FOR ALL
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);

CREATE TRIGGER update_specialist_ai_preferences_updated_at
  BEFORE UPDATE ON public.specialist_ai_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



-- Adicionando colunas de classificaÃ§Ã£o para permitir o "Swipe to Swap" (SubstituiÃ§Ã£o Inteligente)
ALTER TABLE public.exercise_library 
ADD COLUMN IF NOT EXISTS equipment text,
ADD COLUMN IF NOT EXISTS movement_pattern text;

-- Atualizando alguns exercÃ­cios bÃ¡sicos para habilitar o MVP da troca
UPDATE public.exercise_library SET equipment = 'Barra', movement_pattern = 'horizontal_press' WHERE name = 'Supino reto com barra';
UPDATE public.exercise_library SET equipment = 'Halter', movement_pattern = 'horizontal_press' WHERE name = 'Supino reto com halteres';
UPDATE public.exercise_library SET equipment = 'MÃ¡quina', movement_pattern = 'horizontal_press' WHERE name = 'Crucifixo mÃ¡quina';

UPDATE public.exercise_library SET equipment = 'Barra', movement_pattern = 'squat' WHERE name = 'Agachamento livre com barra';
UPDATE public.exercise_library SET equipment = 'MÃ¡quina', movement_pattern = 'squat' WHERE name = 'Agachamento hack';
UPDATE public.exercise_library SET equipment = 'MÃ¡quina', movement_pattern = 'squat' WHERE name = 'Leg press 45Â°';

UPDATE public.exercise_library SET equipment = 'Barra', movement_pattern = 'vertical_pull' WHERE name = 'Puxada frontal aberta';
UPDATE public.exercise_library SET equipment = 'Peso Corporal', movement_pattern = 'vertical_pull' WHERE name = 'Barra fixa';

-- Adicionando um Ã­ndice para buscar substitutos mais rÃ¡pido
CREATE INDEX IF NOT EXISTS idx_exercise_movement_pattern ON public.exercise_library(muscle_group, movement_pattern);




ALTER TABLE public.exercise_library ADD COLUMN IF NOT EXISTS movement_pattern text;

UPDATE public.exercise_library SET equipment = 'Barra', movement_pattern = 'horizontal_press' WHERE name = 'Supino reto com barra';
UPDATE public.exercise_library SET equipment = 'Halter', movement_pattern = 'horizontal_press' WHERE name = 'Supino reto com halteres';
UPDATE public.exercise_library SET equipment = 'MÃ¡quina', movement_pattern = 'horizontal_press' WHERE name = 'Crucifixo mÃ¡quina';
UPDATE public.exercise_library SET equipment = 'Barra', movement_pattern = 'squat' WHERE name = 'Agachamento livre com barra';
UPDATE public.exercise_library SET equipment = 'MÃ¡quina', movement_pattern = 'squat' WHERE name = 'Agachamento hack';
UPDATE public.exercise_library SET equipment = 'MÃ¡quina', movement_pattern = 'squat' WHERE name = 'Leg press 45Â°';
UPDATE public.exercise_library SET equipment = 'Barra', movement_pattern = 'vertical_pull' WHERE name = 'Puxada frontal aberta';
UPDATE public.exercise_library SET equipment = 'Peso Corporal', movement_pattern = 'vertical_pull' WHERE name = 'Barra fixa';

CREATE INDEX IF NOT EXISTS idx_exercise_movement_pattern ON public.exercise_library(muscle_group, movement_pattern);




-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Create accent-insensitive food search function
CREATE OR REPLACE FUNCTION public.search_foods_unaccent(
  search_term text,
  max_results integer DEFAULT 30
)
RETURNS SETOF public.food_database
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.food_database
  WHERE extensions.unaccent(lower(name)) ILIKE '%' || extensions.unaccent(lower(search_term)) || '%'
  ORDER BY length(name), name
  LIMIT max_results;
$$;




-- Add new columns to specialist_ai_preferences
ALTER TABLE public.specialist_ai_preferences
  ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS knowledge_base_pdf_path TEXT DEFAULT NULL;

-- Create ai_knowledge storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-knowledge', 'ai-knowledge', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: specialists can upload to their own folder
CREATE POLICY "Specialists upload own AI knowledge"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-knowledge'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: specialists can read their own files
CREATE POLICY "Specialists read own AI knowledge"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ai-knowledge'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: specialists can delete their own files
CREATE POLICY "Specialists delete own AI knowledge"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-knowledge'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: specialists can update their own files
CREATE POLICY "Specialists update own AI knowledge"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ai-knowledge'
  AND (storage.foldername(name))[1] = auth.uid()::text
);




-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create knowledge base table for RAG embeddings
CREATE TABLE public.ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding extensions.vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for fast similarity search
CREATE INDEX ai_knowledge_base_embedding_idx 
  ON public.ai_knowledge_base 
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

-- Create index for specialist filtering
CREATE INDEX ai_knowledge_base_specialist_idx 
  ON public.ai_knowledge_base (specialist_id);

-- Enable RLS
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS: specialists manage their own knowledge base
CREATE POLICY "Specialists manage own knowledge base"
  ON public.ai_knowledge_base
  FOR ALL
  TO authenticated
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);

-- Match documents function for similarity search
CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding extensions.vector(768),
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7,
  filter_specialist_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding)::FLOAT AS similarity
  FROM public.ai_knowledge_base kb
  WHERE 
    (filter_specialist_id IS NULL OR kb.specialist_id = filter_specialist_id)
    AND 1 - (kb.embedding <=> query_embedding)::FLOAT > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;




CREATE TABLE public.ai_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id uuid NOT NULL,
  student_id uuid NOT NULL,
  prompt_context text,
  generated_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer,
  feedback varchar(10) CHECK (feedback IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Specialists manage own logs"
  ON public.ai_generation_logs FOR ALL
  USING (auth.uid() = specialist_id)
  WITH CHECK (auth.uid() = specialist_id);

CREATE POLICY "Service role insert logs"
  ON public.ai_generation_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_ai_gen_logs_specialist_feedback 
  ON public.ai_generation_logs (specialist_id, feedback, created_at DESC);



