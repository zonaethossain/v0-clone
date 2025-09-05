import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, error_description)
    return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
            })
          },
        },
      },
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data.user) {
      // Create or update user profile
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            data.user.user_metadata?.display_name ||
            null,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          provider: data.user.app_metadata?.provider || "email",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      )

      if (profileError) {
        console.error("Profile creation error:", profileError)
      }

      // Create response with cookies
      const response = NextResponse.redirect(`${origin}${next}`)

      // Set auth cookies
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        response.cookies.set("sb-access-token", session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
        response.cookies.set("sb-refresh-token", session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      }

      return response
    } else {
      console.error("Session exchange error:", exchangeError)
      return NextResponse.redirect(`${origin}/auth/sign-in?error=${encodeURIComponent("Authentication failed")}`)
    }
  }

  // No code parameter, redirect to sign in
  return NextResponse.redirect(`${origin}/auth/sign-in`)
}
