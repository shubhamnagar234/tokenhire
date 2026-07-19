"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestCase {
  input: string;
  expected: string;
  isHidden: boolean;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  testCases: TestCase[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: "bg-green-500/15 text-green-400 border-green-500/30",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  HARD: "bg-red-500/15 text-red-400 border-red-500/30",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  difficulty: "EASY" as "EASY" | "MEDIUM" | "HARD",
  tags: "",
  testCases: [{ input: "", expected: "", isHidden: false }],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProblemsPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user?.role !== "RECRUITER") router.push("/login");
  }, [hydrated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: () => apiRequest<{ problems: Problem[] }>("/api/problems"),
    enabled: !!user,
  });

  // ── Test cases helpers ────────────────────────────────────────────────────

  const addTestCase = () =>
    setForm((f) => ({
      ...f,
      testCases: [...f.testCases, { input: "", expected: "", isHidden: false }],
    }));

  const removeTestCase = (i: number) =>
    setForm((f) => ({
      ...f,
      testCases: f.testCases.filter((_, idx) => idx !== i),
    }));

  const updateTestCase = (
    i: number,
    key: keyof TestCase,
    value: string | boolean,
  ) =>
    setForm((f) => ({
      ...f,
      testCases: f.testCases.map((tc, idx) =>
        idx === i ? { ...tc, [key]: value } : tc,
      ),
    }));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/api/problems", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          difficulty: form.difficulty,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          testCases: form.testCases,
        }),
      });
      toast.success("Problem created!");
      setForm(EMPTY_FORM);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!hydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const problems = data?.problems ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Dashboard
            </Button>
          </Link>
          <h1 className="font-semibold">Problem Bank</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New Problem"}
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* ── Create problem form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-blue-500/30 mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Create New Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    required
                    placeholder="e.g. Two Sum"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 text-foreground placeholder:text-muted-foreground resize-none"
                    placeholder="Problem statement, constraints, and examples…"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                {/* Difficulty + Tags row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Difficulty</Label>
                    <div className="flex gap-2">
                      {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setForm({ ...form, difficulty: d })}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                            form.difficulty === d
                              ? DIFFICULTY_STYLE[d]
                              : "border-border text-muted-foreground hover:border-muted-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tags (comma separated)</Label>
                    <Input
                      placeholder="e.g. array, hash-map, two-pointer"
                      value={form.tags}
                      onChange={(e) =>
                        setForm({ ...form, tags: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Test cases */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Test Cases</Label>
                    <button
                      type="button"
                      onClick={addTestCase}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      + Add test case
                    </button>
                  </div>
                  {form.testCases.map((tc, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-start bg-secondary/30 rounded-lg p-3"
                    >
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Input
                        </p>
                        <textarea
                          rows={2}
                          required
                          className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500/50 text-foreground resize-none"
                          value={tc.input}
                          onChange={(e) =>
                            updateTestCase(i, "input", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Expected Output
                        </p>
                        <textarea
                          rows={2}
                          required
                          className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500/50 text-foreground resize-none"
                          value={tc.expected}
                          onChange={(e) =>
                            updateTestCase(i, "expected", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1 pt-5">
                        <span className="text-[10px] text-muted-foreground">
                          Hidden
                        </span>
                        <input
                          type="checkbox"
                          checked={tc.isHidden}
                          onChange={(e) =>
                            updateTestCase(i, "isHidden", e.target.checked)
                          }
                          className="w-4 h-4 accent-blue-500"
                        />
                      </div>
                      <div className="pt-5">
                        {form.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestCase(i)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Creating…" : "Create Problem"}
                </Button>
              </form>
            </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Problem list ── */}
        {problems.length === 0 && !showForm ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-2"
              >
                <span className="text-3xl">📝</span>
              </motion.div>
              <p className="text-muted-foreground text-center">
                No problems yet. Create your first problem to add it to tests.
              </p>
              <Button onClick={() => setShowForm(true)}>+ New Problem</Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              show: { transition: { staggerChildren: 0.05 } }
            }}
            className="space-y-3"
          >
            {problems.length > 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                {problems.length} problem{problems.length !== 1 ? "s" : ""} in
                your bank
              </p>
            )}
            {problems.map((problem) => (
              <motion.div
                key={problem.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:border-border/80 transition-colors">
                  <CardContent className="py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{problem.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${DIFFICULTY_STYLE[problem.difficulty]}`}
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {problem.description}
                    </p>
                    {(problem.tags as string[]).length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {(problem.tags as string[]).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">
                      {problem.testCases.length} test case
                      {problem.testCases.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {problem.testCases.filter((tc) => tc.isHidden).length}{" "}
                      hidden
                    </p>
                  </div>
                </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
