"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { motion } from "motion/react";

export default function NewTestPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    timeLimitMins: 60,
    tokenBudget: 500,
    weightCorrectness: 0.5,
    weightTime: 0.2,
    weightTokenSaving: 0.2,
    weightCodeQuality: 0.1,
    aiModel: "GEMINI_2_5_FLASH" as "GEMINI_2_5_FLASH" | "GEMINI_2_5_PRO",
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!user || user?.role !== "RECRUITER") {
      router.push("/login");
    }
  }, [hydrated, user, router]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest("/api/tests", {
        method: "POST",
        body: JSON.stringify({ ...form }),
      });

      toast.success("Test created!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const totalWeight =
    form.weightCorrectness +
    form.weightTime +
    form.weightTokenSaving +
    form.weightCodeQuality;

  const weightsValid = Math.abs(totalWeight - 1.0) < 0.01;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border px-6 py-4 flex items-center gap-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="max-w-4xl mx-auto p-6">
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="flex justify-end gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <h1 className="font-semibold">Create New Test</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <motion.form 
          onSubmit={handleCreateTest} 
          className="space-y-6"
          initial="hidden"
          animate="show"
          variants={{
            show: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {/* Basic info */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Frontend Engineer Assessment"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="Brief description for candidates"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={180}
                    value={form.timeLimitMins}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        timeLimitMins: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token Budget</Label>
                  <Input
                    type="number"
                    min={100}
                    max={10000}
                    step={100}
                    value={form.tokenBudget}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tokenBudget: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* AI Model Selector */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Assistant Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  {
                    value: "GEMINI_2_5_FLASH",
                    label: "Gemini 2.5 Flash",
                    desc: "Fast & cost-effective — ideal for most assessments",
                    badge: "Recommended",
                  },
                  {
                    value: "GEMINI_2_5_PRO",
                    label: "Gemini 2.5 Pro",
                    desc: "Advanced reasoning — best for complex technical roles",
                    badge: "Pro",
                  },
                ] as const
              ).map((model) => (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => setForm({ ...form, aiModel: model.value })}
                  className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                    form.aiModel === model.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{model.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {model.desc}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      model.value === "GEMINI_2_5_PRO"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {model.badge}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
          </motion.div>

          {/* Scoring weights */}
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Scoring Weights
                <span
                  className={`ml-2 text-sm font-normal ${weightsValid ? "text-green-400" : "text-red-400"}`}
                >
                  Total: {totalWeight.toFixed(2)}{" "}
                  {weightsValid ? "✓" : "(must equal 1.0)"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: "weightCorrectness",
                  label: "Correctness",
                  desc: "Test cases passed",
                },
                {
                  key: "weightTime",
                  label: "Speed",
                  desc: "Time remaining bonus",
                },
                {
                  key: "weightTokenSaving",
                  label: "Token Efficiency",
                  desc: "Fewer tokens = higher score",
                },
                {
                  key: "weightCodeQuality",
                  label: "Code Quality",
                  desc: "AI-assessed quality",
                },
              ].map((w) => (
                <div key={w.key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{w.label}</p>
                    <p className="text-xs text-muted-foreground">{w.desc}</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-24"
                    value={form[w.key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [w.key]: Number(e.target.value) })
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
            <Button
            type="submit"
            className="w-full"
            disabled={loading || !weightsValid}
          >
            {loading ? "Creating..." : "Create Test"}
          </Button>
          </motion.div>
        </motion.form>
      </main>
    </div>
  );
}
