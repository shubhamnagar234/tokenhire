"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";

interface Test {
  id: string;
  title: string;
  status: string;
  aiModel: string;
  timeLimitMins: number;
  tokenBudget: number;
  createdAt: string;
  problems: { id: string }[];
  invites: { id: string; status: string }[];
}

interface TestsResponse {
  tests: Test[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Valid status transitions
const TRANSITIONS: Record<
  string,
  {
    label: string;
    next: string;
    variant: "default" | "outline" | "destructive";
  }[]
> = {
  DRAFT: [{ label: "Activate", next: "ACTIVE", variant: "default" }],
  ACTIVE: [
    { label: "Pause to Draft", next: "DRAFT", variant: "outline" },
    { label: "Close", next: "CLOSED", variant: "destructive" },
  ],
  CLOSED: [],
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  ACTIVE: "bg-green-500/15 text-green-400 border-green-500/30",
  CLOSED: "bg-secondary text-muted-foreground",
};

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user?.role !== "RECRUITER") {
      router.push("/login");
    }
  }, [hydrated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["tests", page],
    queryFn: () =>
      apiRequest<TestsResponse>(`/api/tests?page=${page}&limit=10`),
    enabled: !!user,
    refetchInterval: 10000,
  });

  const handleLogout = () => {
    clearAuth();
    toast.success("Logged out");
    router.push("/login");
  };

  const handleStatusChange = async (testId: string, newStatus: string) => {
    setLoadingId(testId);
    try {
      await apiRequest(`/api/tests/${testId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(
        `Test ${newStatus === "ACTIVE" ? "activated" : newStatus === "CLOSED" ? "closed" : "moved to draft"} successfully`,
      );
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoadingId(null);
    }
  };

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-20" />
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[250px] rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const tests = data?.tests ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-500">
                Completed Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {tests.reduce(
                  (sum, t) =>
                    sum +
                    t.invites.filter((i) => i.status === "COMPLETED").length,
                  0,
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tests list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Tests</h2>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/problems">
              <Button variant="outline">Problem Bank</Button>
            </Link>
            <Link href="/dashboard/tests/new">
              <Button>Create Test</Button>
            </Link>
          </div>
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
            {tests.map((test) => {
              const transitions = TRANSITIONS[test.status] ?? [];
              const isUpdating = loadingId === test.id;

              return (
                <Card
                  key={test.id}
                  className="hover:border-blue-500/50 transition-colors"
                >
                  <CardContent className="flex items-center justify-between py-4 gap-4">
                    {/* Left — title + meta */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{test.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.problems.length} problems · {test.timeLimitMins}{" "}
                          mins · {test.tokenBudget} tokens
                        </p>
                      </div>
                    </div>

                    {/* Right — badges + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* AI model badge */}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          test.aiModel === "GEMINI_2_5_PRO"
                            ? "border-purple-500/50 text-purple-400"
                            : "border-blue-500/50 text-blue-400"
                        }`}
                      >
                        {test.aiModel === "GEMINI_2_5_PRO"
                          ? "✦ Gemini 2.5 Pro"
                          : "⚡ Gemini 2.5 Flash"}
                      </Badge>

                      {/* Status badge */}
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${STATUS_STYLE[test.status]}`}
                      >
                        {test.status}
                      </Badge>

                      <span className="text-sm text-muted-foreground">
                        {test.invites.length} invited
                      </span>

                      {/* Status transition buttons */}
                      {transitions.map((t) => (
                        <Button
                          key={t.next}
                          variant={t.variant}
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(test.id, t.next)}
                          className={
                            t.variant === "default"
                              ? "bg-green-600 hover:bg-green-700 text-white border-0"
                              : ""
                          }
                        >
                          {isUpdating ? "…" : t.label}
                        </Button>
                      ))}

                      <Link href={`/dashboard/tests/${test.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination controls */}
        {(data?.pagination?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              id="pagination-prev"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {data?.pagination?.page} of {data?.pagination?.totalPages}
            </span>
            <Button
              id="pagination-next"
              variant="outline"
              size="sm"
              disabled={page >= (data?.pagination?.totalPages ?? 1)}
              onClick={() =>
                setPage((p) =>
                  Math.min(data?.pagination?.totalPages ?? 1, p + 1)
                )
              }
            >
              Next →
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
