"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/hooks/useHydrated";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { NumberTicker } from "@/components/ui/number-ticker";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProblemBreakdown {
  problemId: string;
  problemTitle: string;
  difficulty: string;
  description: string;
  language: string;
  code: string;
  testCasesPassed: number;
  testCasesTotal: number;
  passRate: number;
  submittedAt: string;
}

interface SubmissionDetail {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  timeUsedMins: number | null;
  tokensUsed: number;
  tokenBudget: number;
  scores: {
    correctness: number | null;
    time: number | null;
    tokenSaving: number | null;
    codeQuality: number | null;
    composite: number | null;
  };
  candidate: { name: string; email: string };
  test: { title: string; timeLimitMins: number; tokenBudget: number };
  problemBreakdown: ProblemBreakdown[];
  aiUsage: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  JAVA: "java",
  CPP: "cpp",
};

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: "text-green-400 border-green-400/50",
  MEDIUM: "text-yellow-400 border-yellow-400/50",
  HARD: "text-red-400 border-red-400/50",
};

const SCORE_TILES = [
  { key: "composite", label: "Composite", color: "text-blue-400" },
  { key: "correctness", label: "Correctness", color: "text-cyan-400" },
  { key: "time", label: "Speed", color: "text-purple-400" },
  { key: "tokenSaving", label: "Token Eff.", color: "text-green-400" },
  { key: "codeQuality", label: "Code Quality", color: "text-orange-400" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useAuthStore();

  const testId = params.id as string;
  const submissionId = params.submissionId as string;
  const [activeProb, setActiveProb] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user?.role !== "RECRUITER") router.push("/login");
  }, [hydrated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["submission-detail", submissionId],
    queryFn: () =>
      apiRequest<{ submission: SubmissionDetail }>(
        `/api/tests/${testId}/submissions/${submissionId}`,
      ),
    enabled: !!user,
  });

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Submission not found.</p>
      </div>
    );
  }

  const { submission } = data;
  const problem = submission.problemBreakdown[activeProb];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/tests/${testId}`}>
            <Button variant="ghost" size="sm">
              ← Leaderboard
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold">{submission.candidate.name}</h1>
            <p className="text-xs text-muted-foreground">
              {submission.candidate.email}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{submission.test.title}</p>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Score overview */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-5 gap-3"
        >
          {SCORE_TILES.map((tile) => (
            <motion.div
              key={tile.key}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <SpotlightCard
                className={
                  tile.key === "composite"
                    ? "border-blue-500/40 shadow-lg shadow-blue-500/10"
                    : ""
                }
              >
                <CardContent className="pt-4 pb-3 text-center relative z-10">
                  <p className={`text-2xl font-bold ${tile.color}`}>
                    {submission.scores[tile.key] !== null ? (
                      <NumberTicker value={submission.scores[tile.key]!} />
                    ) : (
                      "—"
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tile.label}
                  </p>
                </CardContent>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Summary bar */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground bg-secondary/40 rounded-lg px-4 py-3">
          <span>
            ⏱ {submission.timeUsedMins ?? "—"} / {submission.test.timeLimitMins}{" "}
            mins
          </span>
          <span>
            🪙 {submission.tokensUsed} / {submission.tokenBudget} tokens
          </span>
          <span>
            📋 {submission.problemBreakdown.length} problem
            {submission.problemBreakdown.length !== 1 ? "s" : ""} attempted
          </span>
          {Object.entries(submission.aiUsage).map(([type, tokens]) => (
            <Badge key={type} variant="outline" className="text-xs">
              {type}: {tokens} tokens
            </Badge>
          ))}
        </div>

        {/* Per-problem breakdown */}
        <div className="grid grid-cols-[220px_1fr] gap-4">
          {/* Problem list sidebar */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.2 },
              },
            }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Problems
            </p>
            {submission.problemBreakdown.map((p, i) => {
              const isSelected = activeProb === i;
              return (
                <motion.button
                  key={p.problemId}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    show: { opacity: 1, x: 0 },
                  }}
                  onClick={() => setActiveProb(i)}
                  className={`relative w-full text-left rounded-lg px-3.5 py-3 transition-colors border ${
                    isSelected
                      ? "border-blue-500/50 text-foreground"
                      : "border-border hover:border-muted-foreground bg-secondary/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-review-prob-pill"
                      className="absolute inset-0 bg-blue-500/15 rounded-lg -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.35,
                      }}
                    />
                  )}
                  <p className="text-sm font-medium truncate relative z-10">
                    {p.problemTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1 relative z-10">
                    <span
                      className={`text-[10px] font-semibold ${
                        p.passRate === 100
                          ? "text-green-400"
                          : p.passRate > 0
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {p.testCasesPassed}/{p.testCasesTotal} passed
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Code + details panel */}
          <AnimatePresence mode="wait">
            {problem ? (
              <motion.div
                key={problem.problemId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Problem header */}
                <Card>
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">
                        {problem.problemTitle}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-xs ${DIFFICULTY_STYLE[problem.difficulty]}`}
                      >
                        {problem.difficulty}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ml-auto ${
                          problem.passRate === 100
                            ? "border-green-500/50 text-green-400"
                            : problem.passRate > 0
                              ? "border-yellow-500/50 text-yellow-400"
                              : "border-red-500/50 text-red-400"
                        }`}
                      >
                        {problem.testCasesPassed}/{problem.testCasesTotal} test
                        cases · {problem.passRate}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {problem.language}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {problem.description}
                    </p>
                  </CardHeader>
                </Card>

                {/* Code viewer */}
                <Card>
                  <CardHeader className="pb-0 pt-3">
                    <CardTitle className="text-sm text-muted-foreground font-normal">
                      Submitted Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pt-2">
                    <div className="rounded-b-lg overflow-hidden h-105">
                      <MonacoEditor
                        height="420px"
                        language={
                          MONACO_LANGUAGE_MAP[problem.language] ?? "plaintext"
                        }
                        theme="vs-dark"
                        value={problem.code}
                        options={{
                          readOnly: true,
                          fontSize: 13,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          padding: { top: 12 },
                          fontFamily: "var(--font-geist-mono)",
                          lineNumbers: "on",
                          folding: true,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card>
                  <CardContent className="flex items-center justify-center py-16">
                    <p className="text-muted-foreground text-sm">
                      No submission for this problem.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
