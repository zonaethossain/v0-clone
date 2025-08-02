export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ChatThread {
  id: string
  user_id: string
  project_id: string | null
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  thread_id: string
  role: "user" | "assistant"
  content: string
  metadata: Record<string, any>
  created_at: string
}

export interface GeneratedCode {
  id: string
  thread_id: string
  message_id: string
  file_path: string
  content: string
  language: string
  created_at: string
}

export interface Integration {
  id: string
  project_id: string
  name: string
  type: string
  config: Record<string, any>
  created_at: string
}
