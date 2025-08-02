"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Bot,
  User,
  ImageIcon,
  Paperclip,
  Mic,
  Square,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import type { Message, GeneratedCode } from "@/lib/types"
import { AdvancedCodePreview } from "@/components/advanced-code-preview"

interface EnhancedChatInterfaceProps {
  threadId: string
}

export function EnhancedChatInterface({ threadId }: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Handle file upload logic here
      console.log("File uploaded:", file.name)
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Implement voice recording logic here
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const shareMessage = (message: Message) => {
    // Implement share functionality
    console.log("Sharing message:", message.id)
  }

  const regenerateResponse = async (messageId: string) => {
    // Find the user message that triggered this response
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1]
      if (userMessage.role === "user") {
        // Regenerate response logic
        console.log("Regenerating response for:", userMessage.content)
      }
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}
                >
                  <Card className={`${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <CardContent className="p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>

                      {/* Message metadata */}
                      {message.metadata && Object.keys(message.metadata).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs opacity-70">
                            {message.metadata.model && (
                              <Badge variant="outline" className="text-xs">
                                {message.metadata.model}
                              </Badge>
                            )}
                            {message.metadata.timestamp && (
                              <span>{new Date(message.metadata.timestamp).toLocaleTimeString()}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Message Actions */}
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => copyMessage(message.content)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy message</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => regenerateResponse(message.id)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Regenerate</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => shareMessage(message)}>
                            <Share className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Good response</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Poor response</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Enhanced Code Preview */}
            <AdvancedCodePreview
              codeFiles={generatedCode.filter((code) => messages.some((msg) => msg.id === code.message_id))}
              threadId={threadId}
            />

            {loading && (
              <div className="flex gap-4 justify-start">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">v0 is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Enhanced Input Area */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the UI you want to build..."
                  disabled={loading}
                  className="pr-24"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach file</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add image</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={toggleRecording}
                        className={isRecording ? "text-red-500" : ""}
                      >
                        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isRecording ? "Stop recording" : "Voice input"}</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Button type="submit" disabled={loading || !input.trim()} className="px-6">
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Quick actions:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInput("Create a modern login form")}
                className="text-xs h-7"
              >
                Login form
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInput("Build a dashboard with charts")}
                className="text-xs h-7"
              >
                Dashboard
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInput("Design a landing page")}
                className="text-xs h-7"
              >
                Landing page
              </Button>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </TooltipProvider>
  )
}
