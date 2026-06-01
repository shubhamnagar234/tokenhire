"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useHydrated } from "@/lib/hooks/useHydrated";

export default function NewTestPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    timeLimitMins: 60,
    tokenBudget: 500,
    weightCorrectness: 0.5,
    weightTime: 0.2,
    weightTokenSaving: 0.2,
    weightCodeQuality: 0.1,
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!token || user?.role !== "RECRUITER") {
      router.push("/login");
    }
  }, [hydrated, token, user, router]);

  const handleCreateCompanyAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // create company if not exists
      let cId = companyId;
      if (!cId) {
        const companyData = await apiRequest<{ company: { id: string } }>(
          "/api/company",
          {
            method: "POST",
            body: JSON.stringify({ name: `${user?.name}'s Company` }),
          },
        );
        cId = companyData.company.id;
        setCompanyId(cId);
      }

      // create test
      await apiRequest("/api/tests", {
        method: "POST",
        body: JSON.stringify({ ...form, companyId: cId }),
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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
        <form onSubmit={handleCreateCompanyAndTest} className="space-y-6">
          {/* Basic info */}
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
                    value={form.tokenBudget}
                    onChange={(e) =>
                      setForm({ ...form, tokenBudget: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring weights */}
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

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !weightsValid}
          >
            {loading ? "Creating..." : "Create Test"}
          </Button>
        </form>
      </main>
    </div>
  );
}
