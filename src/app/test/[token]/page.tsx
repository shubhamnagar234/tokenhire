"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { apiRequest } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import { TypingText } from "@/components/ui/typing-text";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  testCases: { input: string; expected: string }[];
  order: number;
}

interface TestData {
  invite: {
    id: string;
    email: string;
    status: string;
    test: {
      id: string;
      title: string;
      description?: string | null;
      timeLimitMins: number;
      tokenBudget: number;
      aiModel: string;
      problems: Problem[];
    };
  };
}

interface Submission {
  id: string;
  tokenBudget: number;
  tokensUsed: number;
  startedAt: string;
  timeLimitMins: number;
}

const LANGUAGES = ["PYTHON", "JAVASCRIPT", "TYPESCRIPT", "JAVA", "CPP"];

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  JAVA: "java",
  CPP: "cpp",
};

const PROMPT_TYPES = [
  { value: "HINT", label: "Hint", description: "Get a directional hint" },
  { value: "EXPLAIN", label: "Explain", description: "Explain the concept" },
  { value: "DEBUG", label: "Debug", description: "Help find the bug" },
  { value: "OPTIMIZE", label: "Optimize", description: "Suggest optimization" },
  {
    value: "GENERATE",
    label: "Generate",
    description: "Generate a code snippet",
  },
];

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [testData, setTestData] = useState<TestData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [activeProblem, setActiveProblem] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("PYTHON");
  const [timeLeft, setTimeLeft] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  // AI panel state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptType, setAiPromptType] = useState("HINT");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inviteToken = params.token as string;

  const [hydrated, setHydrated] = useState(false);

  const handleFinish = useCallback(async () => {
    if (!submission) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      await apiRequest(`/api/test/${inviteToken}/finish`, {
        method: "POST",
        body: JSON.stringify({ submissionId: submission.id }),
      });
      toast.success("Test submitted!");
      router.push(`/test/${inviteToken}/complete`);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  }, [submission, inviteToken, router]);

  useEffect(() => {
    Promise.resolve().then(() => setHydrated(true));
  }, []);

  const {
    data: fetchPayload,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["test-data", inviteToken],
    queryFn: async () => {
      if (user?.role !== "CANDIDATE") {
        throw new Error("Only candidates can take tests");
      }
      const data = await apiRequest<TestData>(`/api/test/${inviteToken}`);

      let sub: { submission: Submission } | null = null;
      // If the test is actively in progress, fetch the submission state
      if (
        data.invite.status === "ACCEPTED" ||
        data.invite.status === "IN_PROGRESS"
      ) {
        sub = await apiRequest<{ submission: Submission }>(
          `/api/test/${inviteToken}/start`,
          { method: "POST" },
        );
      }

      const elapsed = sub
        ? Math.floor(
            (Date.now() - new Date(sub.submission.startedAt).getTime()) / 1000,
          )
        : 0;
      const totalSecs = data.invite.test.timeLimitMins * 60;

      return {
        testData: data,
        submission: sub?.submission || null,
        initialTimeLeft: Math.max(0, totalSecs - elapsed),
      };
    },
    enabled: !!user && hydrated && user.role === "CANDIDATE",
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Sync query data to local state
  useEffect(() => {
    if (fetchPayload && !testData) {
      Promise.resolve().then(() => {
        setTestData(fetchPayload.testData);
        if (fetchPayload.submission) {
          setSubmission(fetchPayload.submission);
          setTokensUsed(fetchPayload.submission.tokensUsed);
          setTimeLeft(fetchPayload.initialTimeLeft);
        }
        setLoading(false);
      });
    }
  }, [fetchPayload, testData]);

  // check auth first
  useEffect(() => {
    if (hydrated && user?.role !== "CANDIDATE" && !isLoading) {
      if (!user) router.push("/login");
      else router.push("/dashboard");
    }
  }, [hydrated, user, router, isLoading]);

  // countdown timer — starts only when submission exists and timeLeft is set
  useEffect(() => {
    if (!timeLeft || !submission) return;
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          handleFinish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, submission]);

  const handleStartTest = async () => {
    setStarting(true);
    try {
      await apiRequest(`/api/test/${inviteToken}/start`, { method: "POST" });
      // Reset local state so it re-syncs with the fresh fetch
      setTestData(null);
      await queryClient.invalidateQueries({
        queryKey: ["test-data", inviteToken],
      });
    } catch (err: unknown) {
      toast.error((err as Error).message);
      setStarting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim() || !submission) return;
    const problem = testData?.invite.test.problems[activeProblem];
    if (!problem) {
      toast.error("No active problem selected.");
      return;
    }
    setAiLoading(true);
    setAiResponse("");

    try {
      const data = await apiRequest<{
        response: string;
        tokensUsed: number;
        tokensRemaining: number;
        totalTokensUsed: number;
      }>(`/api/test/${inviteToken}/ai`, {
        method: "POST",
        body: JSON.stringify({
          prompt: aiPrompt,
          promptType: aiPromptType,
          problemId: problem.id,
          submissionId: submission.id,
        }),
      });

      setAiResponse(data.response);
      setTokensUsed(data.totalTokensUsed);
      toast.success(
        `${data.tokensUsed} tokens used — ${data.tokensRemaining} remaining`,
      );
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!submission || !code.trim()) return;
    setSubmitting(true);

    try {
      const problem = testData?.invite.test.problems[activeProblem];
      const data = await apiRequest<{
        results: { passed: number; total: number; percentage: number };
      }>(`/api/test/${inviteToken}/submit`, {
        method: "POST",
        body: JSON.stringify({
          submissionId: submission.id,
          problemId: problem?.id,
          code,
          language,
        }),
      });

      toast.success(
        `${data.results.passed}/${data.results.total} test cases passed`,
      );
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-500">Could not load test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="px-6 py-4 flex items-center justify-between border-b border-border">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-48" />
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-border p-6 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Test not found.</p>
      </div>
    );
  }

  const test = testData.invite.test;

  // SPLASH SCREEN STATE (Test not started yet)
  if (testData.invite.status === "PENDING") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="min-h-screen flex items-center justify-center bg-background p-4"
        >
          <Card className="w-full max-w-lg border-border shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">T</span>
              </div>
              <CardTitle className="text-2xl font-bold">{test.title}</CardTitle>
              <p className="text-muted-foreground mt-2">
                {test.description || "Technical Assessment"}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {test.timeLimitMins}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Minutes
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {test.tokenBudget}
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    AI Tokens
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-200">
                <h4 className="font-semibold mb-2">Instructions</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Once started, the timer cannot be paused.</li>
                  <li>
                    You have access to an AI assistant, but prompts cost tokens.
                  </li>
                  <li>
                    Your final score evaluates correctness, speed, and AI
                    efficiency.
                  </li>
                </ul>
              </div>

              <Button
                className="w-full py-6 text-lg"
                onClick={handleStartTest}
                disabled={starting}
              >
                {starting ? "Starting..." : "Begin Test"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // TEST INTERFACE (Test in progress)
  const problem = test.problems[activeProblem];
  // Guard against undefined submission during transition
  const tokenPct = submission
    ? Math.round((tokensUsed / submission.tokenBudget) * 100)
    : 0;
  const timeWarning = timeLeft < 300;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen flex flex-col bg-background overflow-hidden"
    >
      {/* TOP HUD */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-semibold text-sm">{test.title}</span>
        </div>

        {/* Timer */}
        <motion.div
          animate={
            timeWarning
              ? { scale: [1, 1.05, 1], opacity: [1, 0.75, 1] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            timeWarning
              ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          className={`flex items-center gap-2 font-mono text-lg font-bold px-2.5 py-1 rounded-md ${
            timeWarning
              ? "text-red-400 bg-red-500/10 border border-red-500/30"
              : "text-foreground"
          }`}
        >
          {timeWarning && (
            <span className="animate-ping w-2 h-2 rounded-full bg-red-400 inline-block mr-1" />
          )}
          {formatTime(timeLeft)}
        </motion.div>

        {/* Token HUD */}
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Tokens: {tokensUsed}/{submission?.tokenBudget ?? test.tokenBudget}
          </span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              layout
              initial={{ width: "0%" }}
              animate={{ width: `${tokenPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${
                tokenPct > 80
                  ? "bg-red-500"
                  : tokenPct > 50
                    ? "bg-yellow-500"
                    : "bg-blue-500"
              }`}
            />
          </div>
          <span className="text-xs text-muted-foreground">{tokenPct}%</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiOpen(!aiOpen)}
            className="text-blue-400 border-blue-500/50"
          >
            AI Assistant
          </Button>
          <Button size="sm" onClick={handleFinish} variant="destructive">
            Finish Test
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* Problem panel */}
        <div className="w-95 border-r border-border flex flex-col overflow-hidden shrink-0">
          <div className="flex border-b border-border px-4 pt-2 gap-1 bg-secondary/20">
            {test.problems.map((p, i) => {
              const isActive = activeProblem === i;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProblem(i)}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-problem-pill"
                      className="absolute inset-0 bg-background border-t border-x border-border rounded-t-md -mb-px z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.4,
                      }}
                    />
                  )}
                  <span className="relative z-20">Problem {i + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={problem?.id || "empty"}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="font-semibold text-base">
                      {problem?.title}
                    </h2>
                    <Badge
                      variant="outline"
                      className={
                        problem?.difficulty === "EASY"
                          ? "text-green-400 border-green-400/50"
                          : problem?.difficulty === "MEDIUM"
                            ? "text-yellow-400 border-yellow-400/50"
                            : "text-red-400 border-red-400/50"
                      }
                    >
                      {problem?.difficulty}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed [&>h1]:text-lg [&>h1]:font-bold [&>h2]:text-base [&>h2]:font-bold [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-5 [&>pre]:bg-secondary [&>pre]:p-2 [&>pre]:rounded-md [&>code]:bg-secondary [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {problem?.description ?? ""}
                    </ReactMarkdown>
                  </div>
                </div>

                {problem?.testCases && problem.testCases.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Examples
                    </p>
                    <div className="space-y-2">
                      {problem.testCases.map((tc, i) => (
                        <div
                          key={i}
                          className="bg-secondary/50 rounded-lg p-3 text-xs font-mono"
                        >
                          <p className="text-muted-foreground">
                            Input:{" "}
                            <span className="text-foreground">{tc.input}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Output:{" "}
                            <span className="text-foreground">
                              {tc.expected}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Language:</span>
            <div className="flex gap-1.5 bg-secondary/40 p-1 rounded-lg">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`relative px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      isSelected
                        ? "text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-lang-pill"
                        className="absolute inset-0 bg-blue-600 rounded-md"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.3,
                        }}
                      />
                    )}
                    <span className="relative z-10">{lang}</span>
                  </button>
                );
              })}
            </div>
            <div className="ml-auto">
              <Button
                size="sm"
                onClick={handleSubmitCode}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? "Running..." : "Run Code"}
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={MONACO_LANGUAGE_MAP[language]}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val ?? "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "var(--font-geist-mono)",
              }}
            />
          </div>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border flex flex-col overflow-hidden shrink-0"
            >
              <div className="w-85 flex flex-col h-full">
                <div className="border-b border-border px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">AI Assistant</span>
                    <p className="text-[10px] mt-0.5 font-semibold text-blue-400">
                      ⚡ Powered by{" "}
                      {test.aiModel.split("/").pop()?.replace(":free", "")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(submission?.tokenBudget ?? 0) - tokensUsed} tokens left
                  </span>
                </div>

                <div className="p-3 border-b border-border">
                  <div className="grid grid-cols-2 gap-1">
                    {PROMPT_TYPES.map((pt) => (
                      <button
                        key={pt.value}
                        onClick={() => setAiPromptType(pt.value)}
                        className={`p-2 rounded text-xs text-left transition-colors ${
                          aiPromptType === pt.value
                            ? "bg-blue-600/20 border border-blue-500/50 text-blue-400"
                            : "border border-border text-muted-foreground hover:border-blue-500/30"
                        }`}
                      >
                        <p className="font-medium">{pt.label}</p>
                        <p className="text-[10px] opacity-70">
                          {pt.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  <AnimatePresence mode="wait">
                    {aiResponse ? (
                      <motion.div
                        key={aiResponse.substring(0, 10)} // Force re-render on new response
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
                      >
                        <TypingText text={aiResponse} />
                      </motion.div>
                    ) : (
                      <motion.p
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-muted-foreground text-center mt-8"
                      >
                        Ask AI for help. Each request uses tokens from your
                        budget.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-3 border-t border-border space-y-2">
                  <textarea
                    className="w-full bg-secondary/50 border border-border rounded p-2 text-sm resize-none focus:outline-none focus:border-blue-500/50 text-foreground"
                    rows={3}
                    placeholder="Ask a question..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleAskAI}
                    disabled={aiLoading || !aiPrompt.trim()}
                  >
                    {aiLoading ? "Thinking..." : "Ask AI"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
