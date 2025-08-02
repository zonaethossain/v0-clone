import { type NextRequest, NextResponse } from "next/server"

// Fallback chat API that simulates v0-like responses
export async function POST(request: NextRequest) {
  try {
    const { message, threadId, messages } = await request.json()

    // Simulate v0-like code generation based on common patterns
    const codeTemplates = {
      login: {
        file: "login-form.tsx",
        content: `"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Login attempt:", { email, password })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}`,
      },
      dashboard: {
        file: "dashboard.tsx",
        content: `"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, DollarSign, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    { title: "Total Users", value: "2,345", icon: Users, change: "+12%" },
    { title: "Revenue", value: "$45,231", icon: DollarSign, change: "+8%" },
    { title: "Growth", value: "23.5%", icon: TrendingUp, change: "+2%" },
    { title: "Analytics", value: "1,234", icon: BarChart3, change: "+5%" },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )`,
      },
      button: {
        file: "custom-button.tsx",
        content: `"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from 'lucide-react'

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  loading?: boolean
  children: React.ReactNode
}

export default function CustomButton({ 
  variant = "default", 
  size = "default", 
  loading = false, 
  children, 
  className,
  disabled,
  ...props 
}: CustomButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn(className)}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}`,
      },
    }

    // Determine what type of component to generate based on the message
    let selectedTemplate = null
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("login") || lowerMessage.includes("sign in") || lowerMessage.includes("auth")) {
      selectedTemplate = codeTemplates.login
    } else if (
      lowerMessage.includes("dashboard") ||
      lowerMessage.includes("stats") ||
      lowerMessage.includes("analytics")
    ) {
      selectedTemplate = codeTemplates.dashboard
    } else if (lowerMessage.includes("button") || lowerMessage.includes("btn")) {
      selectedTemplate = codeTemplates.button
    }

    let responseText = ""
    let codeBlocks = []

    if (selectedTemplate) {
      responseText = `I'll create a ${lowerMessage.includes("login") ? "login form" : lowerMessage.includes("dashboard") ? "dashboard" : "custom button"} component for you.

This component uses modern React patterns with TypeScript and Tailwind CSS, following best practices for accessibility and responsive design.`

      codeBlocks = [
        {
          language: "tsx",
          filePath: selectedTemplate.file,
          content: selectedTemplate.content,
        },
      ]
    } else {
      // Generic response for other requests
      responseText = `I understand you want to create: "${message}"

I'm currently using a fallback system. For the best experience, please ensure the v0 API integration is properly configured. 

Here's a basic React component structure you can customize:`

      codeBlocks = [
        {
          language: "tsx",
          filePath: "custom-component.tsx",
          content: `"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CustomComponent() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Custom Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is a basic component structure. Customize it based on your needs.</p>
      </CardContent>
    </Card>
  )
}`,
        },
      ]
    }

    return NextResponse.json({
      message: responseText,
      code: codeBlocks,
      metadata: {
        model: "fallback-system",
        timestamp: new Date().toISOString(),
        threadId,
      },
    })
  } catch (error) {
    console.error("Fallback chat API error:", error)
    return NextResponse.json({ error: "Failed to generate response using fallback system." }, { status: 500 })
  }
}
