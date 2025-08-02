"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import {
  Eye,
  Code,
  Copy,
  Download,
  Play,
  Square,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react"
import type { GeneratedCode } from "@/lib/types"

interface V0LikeCodePreviewProps {
  codeFiles: GeneratedCode[]
  threadId: string
}

export function V0LikeCodePreview({ codeFiles, threadId }: V0LikeCodePreviewProps) {
  const [activeTab, setActiveTab] = useState("preview")
  const [selectedFile, setSelectedFile] = useState<GeneratedCode | null>(null)
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [isPreviewRunning, setIsPreviewRunning] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (codeFiles.length > 0) {
      setSelectedFile(codeFiles[0])
      generatePreview()
    }
  }, [codeFiles])

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
    body { 
      margin: 0; 
      padding: 20px; 
      font-family: system-ui, -apple-system, sans-serif;
      background: #f9fafb;
    }
    .preview-container { 
      min-height: calc(100vh - 40px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div id="root" class="preview-container"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef } = React;
    
    // Mock shadcn/ui components with v0-like styling
    const Button = ({ children, className = "", variant = "default", size = "default", ...props }) => {
      const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
      const variants = {
        default: "bg-black text-white hover:bg-gray-800",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-gray-300 bg-white hover:bg-gray-50",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "hover:bg-gray-100",
        link: "underline-offset-4 hover:underline text-black"
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
        className: \`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 \${className}\`,
        ...props
      });
    };

    const Card = ({ children, className = "", ...props }) => {
      return React.createElement('div', {
        className: \`rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm \${className}\`,
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
        className: \`text-sm text-gray-500 \${className}\`,
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
    const ComponentName = ${selectedFile.file_path.replace(".tsx", "").replace(/[^a-zA-Z0-9]/g, "") || "Component"};
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(ComponentName));
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
        return { width: "100%", height: "600px" }
    }
  }

  const organizeFiles = (files: GeneratedCode[]) => {
    const organized: { [key: string]: GeneratedCode[] } = {}

    files.forEach((file) => {
      const parts = file.file_path.split("/")
      const folder = parts.length > 1 ? parts[0] : "root"

      if (!organized[folder]) {
        organized[folder] = []
      }
      organized[folder].push(file)
    })

    return organized
  }

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  if (codeFiles.length === 0) {
    return null
  }

  const organizedFiles = organizeFiles(codeFiles)

  return (
    <div className="mt-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <TabsList className="grid w-fit grid-cols-2 bg-gray-100">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Code
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={generatePreview}>
                  <Play className="h-4 w-4 mr-1" />
                  Run
                </Button>
                <Button size="sm" variant="outline" onClick={downloadAllCode}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <TabsContent value="preview" className="m-0">
              <div className="p-4 space-y-4">
                {/* Preview Controls */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={previewMode === "desktop" ? "default" : "ghost"}
                      onClick={() => setPreviewMode("desktop")}
                      className="h-8"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === "tablet" ? "default" : "ghost"}
                      onClick={() => setPreviewMode("tablet")}
                      className="h-8"
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === "mobile" ? "default" : "ghost"}
                      onClick={() => setPreviewMode("mobile")}
                      className="h-8"
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
                    <Button size="sm" variant="ghost" onClick={() => window.open("", "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview Frame */}
                <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                  {isPreviewRunning && previewContent ? (
                    <div className="flex justify-center p-6">
                      <div
                        style={getPreviewDimensions()}
                        className="border border-gray-300 rounded-lg overflow-hidden shadow-lg bg-white"
                      >
                        <iframe
                          srcDoc={previewContent}
                          className="w-full h-full border-0"
                          title="Component Preview"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-gray-500">
                      <div className="text-center">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">Click "Run" to preview your component</p>
                        <p className="text-sm mt-1">Interactive preview will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="m-0">
              <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
                {/* File Explorer */}
                <ResizablePanel defaultSize={25} minSize={20}>
                  <div className="p-4 border-r border-gray-200 bg-gray-50 h-full">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4" />
                      Files ({codeFiles.length})
                    </h4>
                    <div className="space-y-1">
                      {Object.entries(organizedFiles).map(([folder, files]) => (
                        <div key={folder}>
                          {folder !== "root" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-left h-7 px-2"
                              onClick={() => toggleFolder(folder)}
                            >
                              {expandedFolders.has(folder) ? (
                                <ChevronDown className="h-3 w-3 mr-1" />
                              ) : (
                                <ChevronRight className="h-3 w-3 mr-1" />
                              )}
                              <span className="text-xs font-medium">{folder}</span>
                            </Button>
                          )}
                          {(folder === "root" || expandedFolders.has(folder)) && (
                            <div className={folder !== "root" ? "ml-4 space-y-1" : "space-y-1"}>
                              {files.map((file) => (
                                <Button
                                  key={file.id}
                                  variant={selectedFile?.id === file.id ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start text-left h-7 px-2"
                                  onClick={() => setSelectedFile(file)}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                    <span className="truncate text-xs">{file.file_path.split("/").pop()}</span>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle />

                {/* Code Editor */}
                <ResizablePanel defaultSize={75}>
                  <div className="p-4 h-full">
                    {selectedFile && (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{selectedFile.file_path}</h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {selectedFile.language}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(selectedFile.content)}
                            className="h-7"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <div className="bg-gray-900 rounded-lg overflow-hidden border">
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
                            <div className="flex gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-gray-400 ml-2">{selectedFile.file_path}</span>
                          </div>
                          <pre className="p-4 text-sm text-gray-100 overflow-x-auto max-h-96">
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
    </div>
  )
}
