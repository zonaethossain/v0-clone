"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MessageSquare, Folder } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import type { Project, ChatThread } from "@/lib/types"

interface ProjectSidebarProps {
  selectedProject: Project | null
  selectedThread: ChatThread | null
  onProjectSelect: (project: Project) => void
  onThreadSelect: (thread: ChatThread) => void
}

export function ProjectSidebar({
  selectedProject,
  selectedThread,
  onProjectSelect,
  onThreadSelect,
}: ProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewThread, setShowNewThread] = useState(false)

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
    }
  }, [selectedProject])

  const loadProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user?.id)
      .order("updated_at", { ascending: false })

    if (data) {
      setProjects(data)
      if (data.length > 0 && !selectedProject) {
        onProjectSelect(data[0])
      }
    }
  }

  const loadThreads = async (projectId: string) => {
    const { data } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })

    if (data) {
      setThreads(data)
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return

    const { data } = await supabase
      .from("projects")
      .insert({
        user_id: user?.id,
        name: newProjectName,
        description: newProjectDescription,
      })
      .select()
      .single()

    if (data) {
      setProjects((prev) => [data, ...prev])
      onProjectSelect(data)
      setNewProjectName("")
      setNewProjectDescription("")
      setShowNewProject(false)
    }
  }

  const createThread = async () => {
    if (!newThreadTitle.trim() || !selectedProject) return

    const { data } = await supabase
      .from("chat_threads")
      .insert({
        user_id: user?.id,
        project_id: selectedProject.id,
        title: newThreadTitle,
      })
      .select()
      .single()

    if (data) {
      setThreads((prev) => [data, ...prev])
      onThreadSelect(data)
      setNewThreadTitle("")
      setShowNewThread(false)
    }
  }

  return (
    <div className="w-80 border-r bg-muted/50 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Projects</h2>
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Describe your project..."
                  />
                </div>
                <Button onClick={createProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <ScrollArea className="h-32">
          <div className="space-y-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`cursor-pointer transition-colors ${
                  selectedProject?.id === project.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                }`}
                onClick={() => onProjectSelect(project)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {selectedProject && (
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Chat Threads</h3>
            <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Chat Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="thread-title">Thread Title</Label>
                    <Input
                      id="thread-title"
                      value={newThreadTitle}
                      onChange={(e) => setNewThreadTitle(e.target.value)}
                      placeholder="Landing page design"
                    />
                  </div>
                  <Button onClick={createThread} className="w-full">
                    Create Thread
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {threads.map((thread) => (
                <Card
                  key={thread.id}
                  className={`cursor-pointer transition-colors ${
                    selectedThread?.id === thread.id ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => onThreadSelect(thread)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <p className="font-medium truncate">{thread.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
