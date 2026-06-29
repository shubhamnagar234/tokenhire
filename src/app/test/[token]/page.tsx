"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { apiRequest } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { gsap } from "gsap";

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
      timeLimitMins: number;
      tokenBudget: number;
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
];

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [testData, setTestData] = useState<TestData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [activeProblem, setActiveProblem] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("PYTHON");
  const [timeLeft, setTimeLeft] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // AI panel state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPromptType, setAiPromptType] = useState("HINT");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const tokenBarRef = useRef<HTMLDivElement>(null);
  const inviteToken = params.token as string;

  const [hydrated, setHydrated] = useState(false);

  const handleFinish = useCallback(async () => {
    if (!submission) return;

    try {
      const data = await apiRequest<{
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
      }>(`/api/test/${inviteToken}/finish`, {
        method: "POST",
        body: JSON.stringify({ submissionId: submission.id }),
      });
      // store scores for complete page
      sessionStorage.setItem("tokenhire-scores", JSON.stringify(data));
      toast.success("Test submitted!");
      router.push(`/test/${inviteToken}/complete`);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  }, [submission, inviteToken, router]);

  useEffect(() => {
    Promise.resolve().then(() => setHydrated(true));
  }, []);

  const { data: fetchPayload, isLoading } = useQuery({
    queryKey: ["test-data", inviteToken],
    queryFn: async () => {
      if (user?.role !== "CANDIDATE") {
        throw new Error("Only candidates can take tests");
      }
      const data = await apiRequest<TestData>(`/api/test/${inviteToken}`);
      const sub = await apiRequest<{ submission: Submission }>(`/api/test/${inviteToken}/start`, { method: "POST" });
      
      const elapsed = Math.floor((Date.now() - new Date(sub.submission.startedAt).getTime()) / 1000);
      const totalSecs = data.invite.test.timeLimitMins * 60;
      
      return { testData: data, submission: sub.submission, initialTimeLeft: Math.max(0, totalSecs - elapsed) };
    },
    enabled: !!user && hydrated,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Sync query data to local state
  useEffect(() => {
    if (fetchPayload && !testData) {
      Promise.resolve().then(() => {
        setTestData(fetchPayload.testData);
        setSubmission(fetchPayload.submission);
        setTokensUsed(fetchPayload.submission.tokensUsed);
        setTimeLeft(fetchPayload.initialTimeLeft);
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

  // countdown timer
  useEffect(() => {
    if (!timeLeft) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, handleFinish]);

  // GSAP token bar animation
  useEffect(() => {
    if (!tokenBarRef.current || !submission) return;
    const pct = (tokensUsed / submission.tokenBudget) * 100;
    gsap.to(tokenBarRef.current, {
      width: `${pct}%`,
      duration: 0.5,
      ease: "power2.out",
    });
  }, [tokensUsed, submission]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim() || !submission) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      const problem = testData?.invite.test.problems[activeProblem];
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
          problemId: problem?.id,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading test...</p>
      </div>
    );
  }

  if (!testData || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Test not found or already completed.
        </p>
      </div>
    );
  }

  const test = testData.invite.test;
  const problem = test.problems[activeProblem];
  const tokenPct = Math.round((tokensUsed / submission.tokenBudget) * 100);
  const timeWarning = timeLeft < 300;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* TOP HUD */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">T</span>
          </div>
          <span className="font-semibold text-sm">{test.title}</span>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 font-mono text-lg font-bold ${timeWarning ? "text-red-400" : "text-foreground"}`}
        >
          {formatTime(timeLeft)}
        </div>

        {/* Token HUD */}
        <div className="flex items-center gap-3 flex-1 max-w-sm">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Tokens: {tokensUsed}/{submission.tokenBudget}
          </span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              ref={tokenBarRef}
              className={`h-full rounded-full ${
                tokenPct > 80
                  ? "bg-red-500"
                  : tokenPct > 50
                    ? "bg-yellow-500"
                    : "bg-blue-500"
              }`}
              style={{ width: "0%" }}
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
        <div className="w-[380px] border-r border-border flex flex-col overflow-hidden shrink-0">
          {/* Problem tabs */}
          <div className="flex border-b border-border px-4 pt-2 gap-1">
            {test.problems.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveProblem(i)}
                className={`px-3 py-1.5 text-sm rounded-t transition-colors ${
                  activeProblem === i
                    ? "bg-background border border-b-background border-border text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Problem content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-semibold text-base">{problem.title}</h2>
                <Badge
                  variant="outline"
                  className={
                    problem.difficulty === "EASY"
                      ? "text-green-400 border-green-400/50"
                      : problem.difficulty === "MEDIUM"
                        ? "text-yellow-400 border-yellow-400/50"
                        : "text-red-400 border-red-400/50"
                  }
                >
                  {problem.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {problem.description}
              </p>
            </div>

            {/* Test cases */}
            {problem.testCases.length > 0 && (
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
                        <span className="text-foreground">{tc.expected}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Language selector */}
          <div className="border-b border-border px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Language:</span>
            <div className="flex gap-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    language === lang
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang}
                </button>
              ))}
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

          {/* Monaco */}
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
        {aiOpen && (
          <div className="w-[340px] border-l border-border flex flex-col overflow-hidden shrink-0">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <span className="font-medium text-sm">AI Assistant</span>
              <span className="text-xs text-muted-foreground">
                {submission.tokenBudget - tokensUsed} tokens left
              </span>
            </div>

            {/* Prompt type */}
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
                    <p className="text-[10px] opacity-70">{pt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Response */}
            <div className="flex-1 overflow-y-auto p-3">
              {aiResponse ? (
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {aiResponse}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center mt-8">
                  Ask AI for help. Each request uses tokens from your budget.
                </p>
              )}
            </div>

            {/* Input */}
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
        )}
      </div>
    </div>
  );
}
