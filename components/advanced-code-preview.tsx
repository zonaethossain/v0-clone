"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Eye, Code, Copy, Download, Play, Square, RefreshCw, FileText, Smartphone, Monitor, Tablet } from "lucide-react"
import type { GeneratedCode } from "@/lib/types"

interface AdvancedCodePreviewProps {
  codeFiles: GeneratedCode[]
  threadId: string
}

export function AdvancedCodePreview({ codeFiles, threadId }: AdvancedCodePreviewProps) {
  const [activeTab, setActiveTab] = useState("preview")
  const [selectedFile, setSelectedFile] = useState<GeneratedCode | null>(null)
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [isPreviewRunning, setIsPreviewRunning] = useState(false)
  const [previewContent, setPreviewContent] = useState("")

  useEffect(() => {
    if (codeFiles.length > 0 && !selectedFile) {
      setSelectedFile(codeFiles[0])
    }
  }, [codeFiles, selectedFile])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadAllCode = () => {
    const zip = codeFiles.map((file) => ({
      name: file.file_path,
      content: file.content,
    }))

    const allCode = zip.map((file) => `// ${file.name}\n${file.content}\n\n`).join("")
    const blob = new Blob([allCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `v0-generated-${threadId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const generatePreview = () => {
    if (!selectedFile) return

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>v0 Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
    .preview-container { min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root" class="preview-container"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    
    // Mock shadcn/ui components
    const Button = ({ children, className = "", variant = "default", size = "default", ...props }) => {
      const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
      const variants = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary"
      };
      const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10"
      };
      return React.createElement('button', {
        className: \`\${baseClasses} \${variants[variant]} \${sizes[size]} \${className}\`,
        ...props
      }, children);
    };

    const Input = ({ className = "", ...props }) => {
      return React.createElement('input', {
        className: \`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`,
        ...props
      });
    };

    const Card = ({ children, className = "", ...props }) => {
      return React.createElement('div', {
        className: \`rounded-lg border bg-card text-card-foreground shadow-sm \${className}\`,
        ...props
      }, children);
    };

    const CardHeader = ({ children, className = "", ...props }) => {
      return React.createElement('div', {
        className: \`flex flex-col space-y-1.5 p-6 \${className}\`,
        ...props
      }, children);
    };

    const CardTitle = ({ children, className = "", ...props }) => {
      return React.createElement('h3', {
        className: \`text-2xl font-semibold leading-none tracking-tight \${className}\`,
        ...props
      }, children);
    };

    const CardDescription = ({ children, className = "", ...props }) => {
      return React.createElement('p', {
        className: \`text-sm text-muted-foreground \${className}\`,
        ...props
      }, children);
    };

    const CardContent = ({ children, className = "", ...props }) => {
      return React.createElement('div', {
        className: \`p-6 pt-0 \${className}\`,
        ...props
      }, children);
    };

    const Label = ({ children, className = "", ...props }) => {
      return React.createElement('label', {
        className: \`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 \${className}\`,
        ...props
      }, children);
    };

    // Component code
    ${selectedFile.content.replace(/from "@\/components\/ui\/[^"]+"/g, "// from shadcn/ui")}

    // Render the component
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(${selectedFile.file_path.replace(".tsx", "").replace(/[^a-zA-Z0-9]/g, "") || "Component"}));
  </script>
</body>
</html>`

    setPreviewContent(htmlTemplate)
    setIsPreviewRunning(true)
  }

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case "mobile":
        return { width: "375px", height: "667px" }
      case "tablet":
        return { width: "768px", height: "1024px" }
      default:
        return { width: "100%", height: "100%" }
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
            <Button size="sm" variant="outline" onClick={generatePreview}>
              <Play className="h-4 w-4 mr-1" />
              Run Preview
            </Button>
            <Button size="sm" variant="outline" onClick={downloadAllCode}>
              <Download className="h-4 w-4 mr-1" />
              Download
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
            <div className="space-y-4">
              {/* Preview Controls */}
              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={previewMode === "desktop" ? "default" : "ghost"}
                    onClick={() => setPreviewMode("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === "tablet" ? "default" : "ghost"}
                    onClick={() => setPreviewMode("tablet")}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === "mobile" ? "default" : "ghost"}
                    onClick={() => setPreviewMode("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsPreviewRunning(false)}>
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={generatePreview}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview Frame */}
              <div className="border rounded-lg bg-white overflow-hidden">
                {isPreviewRunning && previewContent ? (
                  <div className="flex justify-center p-4">
                    <div style={getPreviewDimensions()} className="border rounded-lg overflow-hidden shadow-lg">
                      <iframe
                        srcDoc={previewContent}
                        className="w-full h-full border-0"
                        title="Component Preview"
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Run Preview" to see your component in action</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
              {/* File Explorer */}
              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="p-4 border-r">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Files
                  </h4>
                  <div className="space-y-1">
                    {codeFiles.map((file) => (
                      <Button
                        key={file.id}
                        variant={selectedFile?.id === file.id ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedFile(file)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <span className="truncate text-xs">{file.file_path}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Code Editor */}
              <ResizablePanel defaultSize={75}>
                <div className="p-4">
                  {selectedFile && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{selectedFile.file_path}</h4>
                          <Badge variant="outline" className="text-xs">
                            {selectedFile.language}
                          </Badge>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(selectedFile.content)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-slate-900 rounded-lg overflow-hidden">
                        <pre className="p-4 text-sm text-slate-100 overflow-x-auto">
                          <code>{selectedFile.content}</code>
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
