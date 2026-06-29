"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught an error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      
      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-8 mt-4 bg-secondary/50 p-4 rounded-lg font-mono text-xs text-left overflow-auto border border-border">
        {error.message || "An unexpected error occurred."}
      </p>
      
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    </div>
  )
}
