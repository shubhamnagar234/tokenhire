"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Confetti } from "@/components/ui/confetti";
import { NumberTicker } from "@/components/ui/number-ticker";

interface CompletionData {
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
    testCasesPassed: number;
    testCasesTotal: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function TestCompletePage() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading, error } = useQuery<CompletionData>({
    queryKey: ["test-result", token],
    queryFn: () => apiRequest(`/api/test/${token}/result`),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-64 w-96 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold">Test Submitted!</h1>
          <p className="text-muted-foreground">
            Your responses have been recorded.
          </p>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <Confetti />
      <div className="max-w-lg w-full space-y-6 relative z-10">
        {/* Score reveal */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">
            Your Score
          </p>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
            className="flex justify-center py-4"
          >
            <CircularProgress
              value={data.scores.composite}
              size={220}
              strokeWidth={16}
            />
          </motion.div>
        </div>

        {/* Score breakdown */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Correctness
                </p>
                <p className="text-2xl font-bold text-blue-400">
                  <NumberTicker value={data.scores.correctness} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.summary.testCasesPassed}/{data.summary.testCasesTotal}{" "}
                  tests
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Speed</p>
                <p className="text-2xl font-bold text-purple-400">
                  <NumberTicker value={data.scores.time} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.summary.timeUsedMins} mins used
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Token Efficiency
                </p>
                <p className="text-2xl font-bold text-green-400">
                  <NumberTicker value={data.scores.tokenSaving} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.summary.tokensUsed}/{data.summary.tokenBudget} used
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Code Quality
                </p>
                <p className="text-2xl font-bold text-orange-400">
                  <NumberTicker value={data.scores.codeQuality} />
                </p>
                <p className="text-xs text-muted-foreground">
                  AI-assisted review
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Token insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-4 pb-3">
              <p className="text-sm text-blue-400 font-medium mb-1">
                Token Efficiency Insight
              </p>
              <p className="text-sm text-muted-foreground">
                You used {data.summary.tokensUsed} of {data.summary.tokenBudget}{" "}
                tokens (
                {Math.round(
                  (data.summary.tokensUsed / data.summary.tokenBudget) * 100,
                )}
                %).
                {data.scores.tokenSaving >= 80
                  ? " Excellent efficiency — you solved problems independently."
                  : data.scores.tokenSaving >= 50
                    ? " Good balance of AI assistance and independent solving."
                    : " Heavy AI usage detected — consider practising independently."}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-sm text-muted-foreground"
        >
          Results have been sent to the recruiter.
        </motion.p>
      </div>
    </div>
  );
}
