import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>
            There was an error during the authentication process. Please try signing in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="w-full">
            <Link href="/auth/sign-in">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
