"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Eye, Code, Copy, Download, ExternalLink } from "lucide-react"
import type { GeneratedCode } from "@/lib/types"

interface CodePreviewProps {
  codeFiles: GeneratedCode[]
  threadId: string
}

// Simple syntax highlighter component to replace react-syntax-highlighter
function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <pre className="bg-slate-900 text-slate-100 p-4 rounded-md overflow-x-auto text-sm">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  )
}

export function CodePreview({ codeFiles, threadId }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState("preview")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadAllCode = () => {
    const zip = codeFiles.map((file) => ({
      name: file.file_path,
      content: file.content,
    }))

    // Create a simple text file with all code
    const allCode = zip.map((file) => `// ${file.name}\n${file.content}\n\n`).join("")

    const blob = new Blob([allCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `generated-code-${threadId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const openInNewTab = () => {
    // Create a simple HTML preview
    const mainComponent = codeFiles.find(
      (file) =>
        file.file_path.includes("page.tsx") ||
        file.file_path.includes("index.tsx") ||
        file.file_path.includes("app.tsx"),
    )

    if (mainComponent) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Code Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            ${mainComponent.content}
          </script>
        </body>
        </html>
      `

      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    }
  }

  if (codeFiles.length === 0) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Generated Code
            <Badge variant="secondary">{codeFiles.length} files</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button size="sm" variant="outline" onClick={downloadAllCode}>
              <Download className="h-4 w-4 mr-1" />
              Download All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-1" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground text-center">
                Interactive preview coming soon. Use the "Preview" button above to open in a new tab.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <div className="space-y-4">
              {codeFiles.map((file) => (
                <Card key={file.id} className="bg-slate-900 text-white">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-3 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        <span className="text-sm font-medium">{file.file_path}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.language}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(file.content)}
                        className="text-white hover:bg-slate-800"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-0">
                      <CodeBlock code={file.content} language={file.language} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
