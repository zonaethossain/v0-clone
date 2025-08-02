"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageSquare, Folder, Search, MoreHorizontal, Star, Calendar, Code, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import type { Project, ChatThread } from "@/lib/types"

interface EnhancedProjectSidebarProps {
  selectedProject: Project | null
  selectedThread: ChatThread | null
  onProjectSelect: (project: Project) => void
  onThreadSelect: (thread: ChatThread) => void
}

export function EnhancedProjectSidebar({
  selectedProject,
  selectedThread,
  onProjectSelect,
  onThreadSelect,
}: EnhancedProjectSidebarProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newThreadTitle, setNewThreadTitle] = useState("")
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewThread, setShowNewThread] = useState(false)
  const [filterBy, setFilterBy] = useState<"all" | "recent" | "starred">("all")

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

  const filteredThreads = threads.filter((thread) => thread.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const getProjectIcon = (project: Project) => {
    // You could add logic here to determine icon based on project type
    return <Folder className="h-4 w-4" />
  }

  const getThreadIcon = (thread: ChatThread) => {
    return <MessageSquare className="h-4 w-4" />
  }

  return (
    <div className="w-80 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Projects</h2>
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0">
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
                  <Zap className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-1 mb-3">
          <Button
            size="sm"
            variant={filterBy === "all" ? "secondary" : "ghost"}
            onClick={() => setFilterBy("all")}
            className="text-xs h-7"
          >
            All
          </Button>
          <Button
            size="sm"
            variant={filterBy === "recent" ? "secondary" : "ghost"}
            onClick={() => setFilterBy("recent")}
            className="text-xs h-7"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Recent
          </Button>
          <Button
            size="sm"
            variant={filterBy === "starred" ? "secondary" : "ghost"}
            onClick={() => setFilterBy("starred")}
            className="text-xs h-7"
          >
            <Star className="h-3 w-3 mr-1" />
            Starred
          </Button>
        </div>

        <ScrollArea className="h-40">
          <div className="space-y-2">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`cursor-pointer transition-all hover:shadow-sm ${
                  selectedProject?.id === project.id ? "bg-primary/10 border-primary shadow-sm" : "hover:bg-muted/50"
                }`}
                onClick={() => onProjectSelect(project)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10">{getProjectIcon(project)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          <Code className="h-2.5 w-2.5 mr-1" />
                          {threads.filter((t) => t.project_id === project.id).length}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Threads */}
      {selectedProject && (
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chats
            </h3>
            <Dialog open={showNewThread} onOpenChange={setShowNewThread}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 w-8 p-0">
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
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Create Thread
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {filteredThreads.map((thread) => (
                <Card
                  key={thread.id}
                  className={`cursor-pointer transition-all hover:shadow-sm ${
                    selectedThread?.id === thread.id ? "bg-primary/10 border-primary shadow-sm" : "hover:bg-muted/50"
                  }`}
                  onClick={() => onThreadSelect(thread)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-blue-500/10">{getThreadIcon(thread)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{thread.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(thread.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
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
