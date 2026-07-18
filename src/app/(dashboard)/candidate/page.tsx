"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { toast } from "sonner";
import { motion } from "motion/react";

interface CandidateTest {
  token: string;
  status: string;
  expiresAt: string;
  test: {
    title: string;
    description: string | null;
    timeLimitMins: number;
    tokenBudget: number;
  };
  submission: {
    id: string;
    status: string;
    scoreComposite: number | null;
    scoreCorrectness: number | null;
    scoreTime: number | null;
    scoreTokenSaving: number | null;
    scoreCodeQuality: number | null;
  } | null;
}

const INVITE_STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  ACCEPTED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/15 text-green-400 border-green-500/30",
  EXPIRED: "bg-secondary text-muted-foreground",
};

export default function CandidateDashboardPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user.role !== "CANDIDATE") {
      router.push("/login");
    }
  }, [hydrated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["candidate-tests"],
    queryFn: () =>
      apiRequest<{ invites: CandidateTest[] }>("/api/candidate/tests"),
    enabled: !!user && user.role === "CANDIDATE",
  });

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const invites = data?.invites ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">
            Welcome, {user?.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAuth();
              toast.success("Logged out");
              router.push("/login");
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">My Assessments</h1>
          <p className="text-muted-foreground">
            View and manage your technical assessments.
          </p>
        </div>

        {invites.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-muted-foreground">
                You haven&apos;t been invited to any assessments yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid gap-4"
          >
            {invites.map((invite) => {
              const isExpired =
                invite.status === "EXPIRED" ||
                new Date(invite.expiresAt) < new Date();
              const canStart =
                (invite.status === "PENDING" || invite.status === "ACCEPTED") &&
                !isExpired;
              const displayStatus =
                isExpired && invite.status !== "COMPLETED"
                  ? "EXPIRED"
                  : invite.status;

              return (
                <motion.div 
                  key={invite.token}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <Card className="hover:border-blue-500/50 transition-colors h-full">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {invite.test.title}
                        </CardTitle>
                        {invite.test.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {invite.test.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${INVITE_STATUS_STYLE[displayStatus] ?? ""}`}
                      >
                        {displayStatus}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <span>⏱ {invite.test.timeLimitMins} mins</span>
                          <span>🪙 {invite.test.tokenBudget} tokens</span>
                          {invite.submission?.scoreComposite != null && (
                            <span className="text-blue-400 font-semibold">
                              Score: {invite.submission.scoreComposite}
                            </span>
                          )}
                        </div>

                        {canStart && (
                          <Link href={`/test/${invite.token}`}>
                            <Button size="sm">Start Assessment</Button>
                          </Link>
                        )}

                        {displayStatus === "COMPLETED" && invite.submission && (
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              Correctness: {invite.submission.scoreCorrectness}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Speed: {invite.submission.scoreTime}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Tokens: {invite.submission.scoreTokenSaving}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Quality: {invite.submission.scoreCodeQuality}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}
