"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, ExternalLink, Key, Database } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EnvSetupGuide() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const envVariables = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      description: "Your Supabase project URL",
      example: "https://your-project.supabase.co",
      icon: <Database className="h-4 w-4" />,
      required: true,
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      description: "Your Supabase anonymous key",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      icon: <Key className="h-4 w-4" />,
      required: true,
    },
    {
      name: "OPENAI_API_KEY",
      description: "Your OpenAI API key for AI code generation",
      example: "sk-proj-...",
      icon: <Key className="h-4 w-4" />,
      required: true,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Environment Setup</h1>
        <p className="text-muted-foreground">Configure your environment variables to get started</p>
      </div>

      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Add these environment variables to your <code>.env.local</code> file in your project root directory.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {envVariables.map((env) => (
          <Card key={env.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {env.icon}
                {env.name}
                {env.required && <Badge variant="destructive">Required</Badge>}
              </CardTitle>
              <CardDescription>{env.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                <span className="flex-1">
                  {env.name}={env.example}
                </span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`${env.name}=${env.example}`)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Supabase Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create a new project at supabase.com</li>
              <li>Go to Settings → API</li>
              <li>Copy your Project URL and anon public key</li>
              <li>Run the SQL scripts in your SQL editor</li>
              <li>Enable GitHub OAuth in Authentication → Providers</li>
            </ol>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              OpenAI Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create an account at platform.openai.com</li>
              <li>Go to API Keys section</li>
              <li>Create a new API key</li>
              <li>Copy the key (starts with sk-proj-...)</li>
              <li>Add billing information if needed</li>
            </ol>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Get OpenAI API Key
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sample .env.local file</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="p-4 bg-muted rounded-md text-sm font-mono overflow-x-auto">
              {`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here`}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 bg-transparent"
              onClick={() =>
                copyToClipboard(`# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here`)
              }
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
