import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mb-6 border border-border">
        <FileQuestion className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4 text-foreground/80">Page Not Found</h2>
      
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        We couldn&apos;t find the page you were looking for. It might have been moved, deleted, or never existed in the first place.
      </p>
      
      <div className="flex gap-4">
        <Link href="/">
          <Button variant="default">Return Home</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
