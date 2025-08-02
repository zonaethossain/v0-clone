-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.generated_code CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chat_threads CASCADE;
DROP TABLE IF EXISTS public.integrations CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Users table (Supabase Auth will handle this, but we can extend it)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat threads table
CREATE TABLE public.chat_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated code table
CREATE TABLE public.generated_code (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'tsx',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations table
CREATE TABLE public.integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can create own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can update own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can delete own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can view messages in own threads" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own threads" ON public.messages;
DROP POLICY IF EXISTS "Users can view code in own threads" ON public.generated_code;
DROP POLICY IF EXISTS "Users can create code in own threads" ON public.generated_code;
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integrations;
DROP POLICY IF EXISTS "Users can manage own integrations" ON public.integrations;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow profile creation on signup" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat threads" ON public.chat_threads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat threads" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat threads" ON public.chat_threads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat threads" ON public.chat_threads
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view messages in own threads" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = messages.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own threads" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = messages.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view code in own threads" ON public.generated_code
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = generated_code.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create code in own threads" ON public.generated_code
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = generated_code.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own integrations" ON public.integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = integrations.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own integrations" ON public.integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = integrations.project_id 
      AND projects.user_id = auth.uid()
    )
  );
