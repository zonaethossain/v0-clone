"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { V0LikeSidebar } from "@/components/v0-like-sidebar"
import { V0LikeChat } from "@/components/v0-like-chat"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, Sparkles, Github, HelpCircle, Bell } from "lucide-react"
import type { Project, ChatThread } from "@/lib/types"
import { redirect } from "next/navigation"

export default function HomePage() {
  const { user, profile, loading, signOut } = useAuth()
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      redirect("/auth/sign-in")
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* v0-like Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="font-bold text-xl text-black">v0</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Help */}
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-black">
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative text-gray-600 hover:text-black">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={user.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{profile?.full_name || user.email}</p>
                    <p className="w-[200px] truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-sm">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm">
                  <Github className="mr-2 h-4 w-4" />
                  <span>GitHub</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <V0LikeSidebar
          selectedProject={selectedProject}
          selectedThread={selectedThread}
          onProjectSelect={setSelectedProject}
          onThreadSelect={setSelectedThread}
        />

        <main className="flex-1 flex flex-col">
          {selectedThread ? (
            <V0LikeChat threadId={selectedThread.id} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900">Welcome to v0</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create beautiful, functional React components with AI. Select a project and start a new chat to begin
                  building.
                </p>
                {selectedProject ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      Project: <span className="font-medium text-gray-900">{selectedProject.name}</span>
                    </p>
                    <p className="text-sm text-gray-500">Create a new chat to start building components</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Create your first project to get started</p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
