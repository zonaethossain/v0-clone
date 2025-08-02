-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.generated_code CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chat_threads CASCADE;
DROP TABLE IF EXISTS public.integrations CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat threads table
CREATE TABLE public.chat_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated code table
CREATE TABLE public.generated_code (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES public.chat_threads(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'tsx',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX idx_chat_threads_user_id ON public.chat_threads(user_id);
CREATE INDEX idx_chat_threads_project_id ON public.chat_threads(project_id);
CREATE INDEX idx_chat_threads_updated_at ON public.chat_threads(updated_at DESC);
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_generated_code_thread_id ON public.generated_code(thread_id);
CREATE INDEX idx_generated_code_message_id ON public.generated_code(message_id);
CREATE INDEX idx_integrations_project_id ON public.integrations(project_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for chat threads
CREATE POLICY "Users can view own chat threads" ON public.chat_threads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat threads" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat threads" ON public.chat_threads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat threads" ON public.chat_threads
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for messages
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

CREATE POLICY "Users can update messages in own threads" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = messages.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in own threads" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = messages.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

-- Create RLS policies for generated code
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

CREATE POLICY "Users can update code in own threads" ON public.generated_code
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = generated_code.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete code in own threads" ON public.generated_code
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads 
      WHERE chat_threads.id = generated_code.thread_id 
      AND chat_threads.user_id = auth.uid()
    )
  );

-- Create RLS policies for integrations
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

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert some sample data for testing (optional)
-- This will be populated when users sign up and create projects
