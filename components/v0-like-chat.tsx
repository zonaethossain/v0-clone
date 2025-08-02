"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, User, Copy, RotateCcw, ThumbsUp, ThumbsDown, Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { Message, GeneratedCode } from "@/lib/types"
import { V0LikeCodePreview } from "@/components/v0-like-code-preview"

interface V0LikeChatProps {
  threadId: string
}

export function V0LikeChat({ threadId }: V0LikeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
    loadGeneratedCode()
  }, [threadId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  const loadGeneratedCode = async () => {
    const { data } = await supabase
      .from("generated_code")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })

    if (data) {
      setGeneratedCode(data)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setLoading(true)

    // Add user message to database
    const { data: messageData } = await supabase
      .from("messages")
      .insert({
        thread_id: threadId,
        role: "user",
        content: userMessage,
      })
      .select()
      .single()

    if (messageData) {
      setMessages((prev) => [...prev, messageData])
    }

    try {
      // Call AI API to generate response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          threadId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate response"
        const { data: errorMessageData } = await supabase
          .from("messages")
          .insert({
            thread_id: threadId,
            role: "assistant",
            content: `❌ Error: ${errorMessage}`,
            metadata: { error: true },
          })
          .select()
          .single()

        if (errorMessageData) {
          setMessages((prev) => [...prev, errorMessageData])
        }
        return
      }

      if (data.message) {
        // Add assistant message to database
        const { data: assistantMessage } = await supabase
          .from("messages")
          .insert({
            thread_id: threadId,
            role: "assistant",
            content: data.message,
            metadata: data.metadata || {},
          })
          .select()
          .single()

        if (assistantMessage) {
          setMessages((prev) => [...prev, assistantMessage])
        }

        // If there's generated code, save it
        if (data.code && data.code.length > 0) {
          const codeInserts = data.code.map((code: any) => ({
            thread_id: threadId,
            message_id: assistantMessage?.id,
            file_path: code.filePath,
            content: code.content,
            language: code.language || "tsx",
          }))

          const { data: codeData } = await supabase.from("generated_code").insert(codeInserts).select()

          if (codeData) {
            setGeneratedCode((prev) => [...prev, ...codeData])
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const { data: errorMessageData } = await supabase
        .from("messages")
        .insert({
          thread_id: threadId,
          role: "assistant",
          content:
            "❌ Network error: Unable to connect to AI service. Please check your internet connection and try again.",
          metadata: { error: true, networkError: true },
        })
        .select()
        .single()

      if (errorMessageData) {
        setMessages((prev) => [...prev, errorMessageData])
      }
    } finally {
      setLoading(false)
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const regenerateResponse = async (messageId: string) => {
    // Find the user message that triggered this response
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === "user") {
        // Remove the old assistant message and regenerate
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        // Trigger regeneration logic here
        console.log("Regenerating response for:", userMessage.content)
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((message, index) => (
            <div key={message.id} className="group">
              <div className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarFallback className="bg-black text-white">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-900 border border-gray-200"
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                  </div>

                  {/* Message Actions */}
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-gray-100"
                        onClick={() => copyMessage(message.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-gray-100"
                        onClick={() => regenerateResponse(message.id)}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-100">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-100">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* Code Preview */}
              {message.role === "assistant" && (
                <V0LikeCodePreview
                  codeFiles={generatedCode.filter((code) => code.message_id === message.id)}
                  threadId={threadId}
                />
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 justify-start">
              <Avatar className="h-8 w-8 border border-gray-200">
                <AvatarFallback className="bg-black text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-gray-600">v0 is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the UI you want to build..."
                disabled={loading}
                className="h-12 pr-12 border-gray-300 focus:border-black focus:ring-black rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-12 px-6 bg-black hover:bg-gray-800 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-gray-500">Try:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInput("Create a modern login form with email and password")}
              className="text-xs h-7 rounded-full border-gray-300 hover:border-black"
            >
              Login form
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInput("Build a dashboard with charts and statistics")}
              className="text-xs h-7 rounded-full border-gray-300 hover:border-black"
            >
              Dashboard
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInput("Design a landing page with hero section")}
              className="text-xs h-7 rounded-full border-gray-300 hover:border-black"
            >
              Landing page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
