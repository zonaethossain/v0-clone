import { type NextRequest, NextResponse } from "next/server"

// Alternative v0 API endpoint with different approach
export async function POST(request: NextRequest) {
  try {
    const { message, messages } = await request.json()

    // Try different v0 API endpoints
    const v0Endpoints = ["https://v0.dev/api/chat", "https://api.v0.dev/generate", "https://v0.dev/api/generate"]

    let lastError = null

    for (const endpoint of v0Endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: "https://v0.dev",
            Referer: "https://v0.dev/",
            "User-Agent": "Mozilla/5.0 (compatible; v0-clone/1.0)",
          },
          body: JSON.stringify({
            prompt: message,
            messages: messages || [],
            model: "gpt-4",
            temperature: 0.7,
            max_tokens: 4000,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }

        lastError = `${endpoint}: ${response.status} ${response.statusText}`
      } catch (err) {
        lastError = `${endpoint}: ${err instanceof Error ? err.message : "Unknown error"}`
        continue
      }
    }

    return NextResponse.json({ error: `All v0 endpoints failed. Last error: ${lastError}` }, { status: 503 })
  } catch (error) {
    console.error("v0 Proxy error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
