"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { toast } from "sonner"

interface Test {
  id: string
  title: string
  status: string
  timeLimitMins: number
  tokenBudget: number
  createdAt: string
  problems: { id: string }[]
  invites: { id: string; status: string }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, token, clearAuth } = useAuthStore()

  useEffect(() => {
    if (!token || !user) {
      router.push("/login")
      return
    }
    if (user.role !== "RECRUITER") {
      router.push("/")
    }
  }, [token, user, router])

  const { data, isLoading } = useQuery({
    queryKey: ["tests"],
    queryFn: () => apiRequest<{ tests: Test[] }>("/api/tests"),
    enabled: !!token,
  })

  const handleLogout = () => {
    clearAuth()
    toast.success("Logged out")
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const tests = data?.tests ?? []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-lg">TokenHire</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {tests.filter((t) => t.status === "ACTIVE").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {tests.reduce((sum, t) => sum + t.invites.length, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tests list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Tests</h2>
          <Link href="/dashboard/tests/new">
            <Button>Create Test</Button>
          </Link>
        </div>

        {tests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-muted-foreground text-center">
                No tests yet. Create your first test to start hiring.
              </p>
              <Link href="/dashboard/tests/new">
                <Button>Create your first test</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <Card key={test.id} className="hover:border-blue-500/50 transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{test.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {test.problems.length} problems · {test.timeLimitMins} mins · {test.tokenBudget} tokens
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={test.status === "ACTIVE" ? "default" : "secondary"}
                    >
                      {test.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {test.invites.length} invited
                    </span>
                    <Link href={`/dashboard/tests/${test.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}