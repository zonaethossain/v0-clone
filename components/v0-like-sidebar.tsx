"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MessageSquare, Search, Trash2, Folder, Clock, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import type { Project, ChatThread } from "@/lib/types"

interface V0LikeSidebarProps {
  selectedProject: Project | null
  selectedThread: ChatThread | null
  onProjectSelect: (project: Project) => void
  onThreadSelect: (thread: ChatThread) => void
}

export function V0LikeSidebar({
  selectedProject,
  selectedThread,
  onProjectSelect,
  onThreadSelect,
}: V0LikeSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewThread, setShowNewThread] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [isCreatingThread, setIsCreatingThread] = useState(false)

  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  useEffect(() => {
    if (selectedProject) {
      loadThreads(selectedProject.id)
    } else {
      setThreads([])
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error loading projects:", error)
        return
      }

      if (data) {
        setProjects(data)
        // Auto-select first project if none selected
        if (data.length > 0 && !selectedProject) {
          onProjectSelect(data[0])
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error)
    }
  }

  const loadThreads = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error loading threads:", error)
        return
      }

      if (data) {
        setThreads(data)
      }
    } catch (error) {
      console.error("Error loading threads:", error)
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim() || isCreatingProject) return

    setIsCreatingProject(true)
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user?.id,
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || null,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating project:", error)
        return
      }

      if (data) {
        setProjects((prev) => [data, ...prev])
        onProjectSelect(data)
        setNewProjectName("")
        setNewProjectDescription("")
        setShowNewProject(false)
      }
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsCreatingProject(false)
    }
  }

  const createThread = async () => {
    if (!newThreadTitle.trim() || !selectedProject || isCreatingThread) return

    setIsCreatingThread(true)
    try {
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({
          user_id: user?.id,
          project_id: selectedProject.id,
          title: newThreadTitle.trim(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating thread:", error)
        return
      }

      if (data) {
        setThreads((prev) => [data, ...prev])
        onThreadSelect(data)
        setNewThreadTitle("")
        setShowNewThread(false)
      }
    } catch (error) {
      console.error("Error creating thread:", error)
    } finally {
      setIsCreatingThread(false)
    }
  }

  const deleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this project?")) {
      const { error } = await supabase.from("projects").delete().eq("id", projectId)

      if (!error) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId))
        if (selectedProject?.id === projectId) {
          const remaining = projects.filter((p) => p.id !== projectId)
          if (remaining.length > 0) {
            onProjectSelect(remaining[0])
          } else {
            onProjectSelect(null as any)
          }
        }
      }
    }
  }

  const deleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this chat?")) {
      const { error } = await supabase.from("chat_threads").delete().eq("id", threadId)

      if (!error) {
        setThreads((prev) => prev.filter((t) => t.id !== threadId))
        if (selectedThread?.id === threadId) {
          onThreadSelect(null as any)
        }
      }
    }
  }

  const filteredThreads = threads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0 bg-black hover:bg-gray-800">
                <Plus className="h-4 w-4 text-white" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Create New Project
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name" className="text-sm font-medium">
                    Project Name
                  </Label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My awesome project"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description" className="text-sm font-medium">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="project-description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Describe your project..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <Button
                  onClick={createProject}
                  className="w-full bg-black hover:bg-gray-800"
                  disabled={!newProjectName.trim() || isCreatingProject}
                >
                  {isCreatingProject ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects List */}
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedProject?.id === project.id ? "bg-gray-100 border border-gray-200" : "hover:bg-gray-50"
                }`}
                onClick={() => onProjectSelect(project)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-1.5 rounded-md bg-purple-100">
                      <Folder className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {new Date(project.updated_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          {threads.filter((t) => t.project_id === project.id).length} chats
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => deleteProject(project.id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Threads */}
      {selectedProject && (
        <div className="flex-1 flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chats
            </h3>
            <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 w-8 p-0 bg-black hover:bg-gray-800">
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    New Chat
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="thread-title" className="text-sm font-medium">
                      Chat Title
                    </Label>
                    <Input
                      id="thread-title"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      placeholder="Landing page design"
                      className="h-10"
                    />
                  </div>
                  <Button
                    onClick={createThread}
                    className="w-full bg-black hover:bg-gray-800"
                    disabled={!newThreadTitle.trim() || isCreatingThread}
                  >
                    {isCreatingThread ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Create Chat
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-gray-50 border-gray-200"
            />
          </div>

          {/* Threads List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedThread?.id === thread.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  }`}
                  onClick={() => onThreadSelect(thread)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-1.5 rounded-md bg-blue-100">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{thread.title}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(thread.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => deleteThread(thread.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
