"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Bot, User } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { Message, GeneratedCode } from "@/lib/types"
import { CodePreview } from "@/components/code-preview"

interface ChatInterfaceProps {
  threadId: string
}

export function ChatInterface({ threadId }: ChatInterfaceProps) {
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
        // Handle API errors
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

      // Add error message to chat
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

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <Card
                className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                <CardContent className="p-3">
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </CardContent>
              </Card>

              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Display generated code with enhanced preview */}
          <CodePreview
            codeFiles={generatedCode.filter((code) => messages.some((msg) => msg.id === code.message_id))}
            threadId={threadId}
          />

          {loading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Generating response...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
