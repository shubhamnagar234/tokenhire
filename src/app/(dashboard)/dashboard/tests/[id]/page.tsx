"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useHydrated } from "@/lib/hooks/useHydrated";

interface LeaderboardEntry {
  rank: number;
  candidate: { name: string; email: string };
  scores: {
    composite: number;
    correctness: number;
    time: number;
    tokenSaving: number;
    codeQuality: number;
  };
  summary: {
    timeUsedMins: number;
    tokensUsed: number;
    tokenBudget: number;
    tokenEfficiency: number;
    aiUsageBreakdown: Record<string, number>;
  };
}

interface LeaderboardData {
  test: { title: string; totalCandidates: number };
  leaderboard: LeaderboardEntry[];
}

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useAuthStore();
  const testId = params.id as string;

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user?.role !== "RECRUITER") {
      router.push("/login");
    }
  }, [hydrated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", testId],
    queryFn: () =>
      apiRequest<LeaderboardData>(`/api/tests/${testId}/leaderboard`),
    enabled: !!user,
  });

  const handleCopyInviteLink = async () => {
    // create new invite
    try {
      const email = prompt("Enter candidate email:");
      if (!email) return;

      const res = await apiRequest<{ invites: { link: string }[] }>(
        `/api/tests/${testId}/invites`,
        {
          method: "POST",
          body: JSON.stringify({ emails: [email], expiresInDays: 7 }),
        },
      );
      const link = res.invites[0].link;
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied to clipboard!");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const leaderboard = data?.leaderboard ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">{data?.test.title}</h1>
            <p className="text-sm text-muted-foreground">
              {data?.test.totalCandidates} completed
            </p>
          </div>
        </div>
        <Button onClick={handleCopyInviteLink}>Invite Candidate</Button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-muted-foreground">
                No candidates have completed this test yet.
              </p>
              <Button onClick={handleCopyInviteLink}>
                Invite your first candidate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            {leaderboard.map((entry) => (
              <Card
                key={entry.rank}
                className={entry.rank === 1 ? "border-yellow-500/50" : ""}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          entry.rank === 1
                            ? "bg-yellow-500/20 text-yellow-400"
                            : entry.rank === 2
                              ? "bg-gray-400/20 text-gray-400"
                              : entry.rank === 3
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <p className="font-medium">{entry.candidate.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.candidate.email}
                        </p>
                      </div>
                    </div>

                    {/* Composite score */}
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-400">
                        {entry.scores.composite}
                      </p>
                      <p className="text-xs text-muted-foreground">composite</p>
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {[
                      {
                        label: "Correctness",
                        value: entry.scores.correctness,
                        color: "text-blue-400",
                      },
                      {
                        label: "Speed",
                        value: entry.scores.time,
                        color: "text-purple-400",
                      },
                      {
                        label: "Token Eff.",
                        value: entry.scores.tokenSaving,
                        color: "text-green-400",
                      },
                      {
                        label: "Code Quality",
                        value: entry.scores.codeQuality,
                        color: "text-orange-400",
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-secondary/50 rounded-lg p-2 text-center"
                      >
                        <p className={`text-lg font-bold ${s.color}`}>
                          {s.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* AI usage */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{entry.summary.timeUsedMins} mins used</span>
                    <span>
                      {entry.summary.tokensUsed}/{entry.summary.tokenBudget}{" "}
                      tokens
                    </span>
                    <span className="text-green-400">
                      {entry.summary.tokenEfficiency}% efficient
                    </span>
                    {Object.entries(entry.summary.aiUsageBreakdown).map(
                      ([type, tokens]) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}: {tokens} tokens
                        </Badge>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
