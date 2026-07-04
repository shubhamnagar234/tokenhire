"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useHydrated } from "@/lib/hooks/useHydrated";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  test: { title: string; aiModel: string; totalCandidates: number };
  leaderboard: LeaderboardEntry[];
}

interface Invite {
  id: string;
  email: string;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  candidate: { name: string; email: string } | null;
  submission: { scoreComposite: number | null; status: string } | null;
}

// ─── Status styling ───────────────────────────────────────────────────────────

const INVITE_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  ACCEPTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/15 text-green-400 border-green-500/30",
  EXPIRED: "bg-secondary text-muted-foreground",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const testId = params.id as string;

  const [activeTab, setActiveTab] = useState<"leaderboard" | "invites">(
    "leaderboard",
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user?.role !== "RECRUITER") {
      router.push("/login");
    }
  }, [hydrated, user, router]);

  // Leaderboard query
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", testId],
    queryFn: () =>
      apiRequest<LeaderboardData>(`/api/tests/${testId}/leaderboard`),
    enabled: !!user,
    refetchInterval: 5000,
  });

  // Invites query
  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ["invites", testId],
    queryFn: () =>
      apiRequest<{ invites: Invite[] }>(`/api/tests/${testId}/invites`),
    enabled: !!user && activeTab === "invites",
    refetchInterval: activeTab === "invites" ? 10000 : false,
  });

  // Live leaderboard toast
  useEffect(() => {
    if (data?.leaderboard) {
      if (
        prevCountRef.current > 0 &&
        data.leaderboard.length > prevCountRef.current
      ) {
        toast.info("A new candidate has submitted their test!", {
          description: "The leaderboard has been updated live.",
          icon: "🚀",
        });
      }
      prevCountRef.current = data.leaderboard.length;
    }
  }, [data?.leaderboard]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await apiRequest<{ invites: { link: string }[] }>(
        `/api/tests/${testId}/invites`,
        {
          method: "POST",
          body: JSON.stringify({
            emails: [inviteEmail.trim()],
            expiresInDays: 7,
          }),
        },
      );
      const link = res.invites[0].link;
      await navigator.clipboard.writeText(link);
      toast.success("Invite sent — link copied to clipboard!");
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["invites", testId] });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/test/${token}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const handleRevoke = async (inviteId: string) => {
    setRevoking(inviteId);
    try {
      await apiRequest(`/api/tests/${testId}/invites`, {
        method: "DELETE",
        body: JSON.stringify({ inviteId }),
      });
      toast.success("Invite revoked.");
      queryClient.invalidateQueries({ queryKey: ["invites", testId] });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setRevoking(null);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const leaderboard = data?.leaderboard ?? [];
  const invites = invitesData?.invites ?? [];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">{data?.test.title}</h1>
              {data?.test.aiModel && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    data.test.aiModel === "GEMINI_2_5_PRO"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {data.test.aiModel === "GEMINI_2_5_PRO"
                    ? "✦ Gemini 2.5 Pro"
                    : "⚡ Gemini 2.5 Flash"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {data?.test.totalCandidates} completed
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex gap-1 max-w-5xl mx-auto">
          {(["leaderboard", "invites"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {tab === "invites" && invitesData && (
                <span className="ml-1.5 text-xs bg-secondary px-1.5 py-0.5 rounded-full">
                  {invites.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* ── LEADERBOARD TAB ── */}
        {activeTab === "leaderboard" && (
          <>
            {leaderboard.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                  <p className="text-muted-foreground">
                    No candidates have completed this test yet.
                  </p>
                  <Button onClick={() => setActiveTab("invites")}>
                    Go to Invites →
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
                            <p className="font-medium">
                              {entry.candidate.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.candidate.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-400">
                            {entry.scores.composite}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            composite
                          </p>
                        </div>
                      </div>

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
                            <Badge
                              key={type}
                              variant="outline"
                              className="text-xs"
                            >
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
          </>
        )}

        {/* ── INVITES TAB ── */}
        {activeTab === "invites" && (
          <div className="space-y-6">
            {/* Send invite form */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-sm font-medium mb-3">Send a new invite</p>
                <form onSubmit={handleSendInvite} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="candidate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button type="submit" disabled={inviting} size="sm">
                    {inviting ? "Sending…" : "Send & Copy Link"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Invite list */}
            {invitesLoading ? (
              <p className="text-sm text-muted-foreground">Loading invites…</p>
            ) : invites.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground text-sm">
                    No invites sent yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {invites.length} invite{invites.length !== 1 ? "s" : ""}
                </p>
                {invites.map((invite) => {
                  const isExpired =
                    invite.status === "EXPIRED" ||
                    new Date(invite.expiresAt) < new Date();
                  const canRevoke =
                    invite.status !== "COMPLETED" &&
                    invite.status !== "EXPIRED";

                  return (
                    <Card
                      key={invite.id}
                      className="transition-colors hover:border-border/80"
                    >
                      <CardContent className="flex items-center justify-between py-3 gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {invite.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invite.candidate?.name
                              ? `Accepted by ${invite.candidate.name} · `
                              : ""}
                            Expires{" "}
                            {new Date(invite.expiresAt).toLocaleDateString()}
                            {invite.submission?.scoreComposite != null
                              ? ` · Score: ${invite.submission.scoreComposite}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-xs ${INVITE_STATUS_STYLE[invite.status] ?? ""}`}
                          >
                            {invite.status}
                          </Badge>

                          {/* Copy link — only for non-expired, non-completed */}
                          {canRevoke && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={() => handleCopyLink(invite.token)}
                            >
                              Copy Link
                            </Button>
                          )}

                          {/* Revoke */}
                          {canRevoke && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              disabled={revoking === invite.id}
                              onClick={() => handleRevoke(invite.id)}
                            >
                              {revoking === invite.id ? "…" : "Revoke"}
                            </Button>
                          )}

                          {isExpired && invite.status !== "COMPLETED" && (
                            <span className="text-xs text-muted-foreground">
                              Expired
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
