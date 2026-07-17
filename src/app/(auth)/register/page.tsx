"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { motion, useAnimationControls } from "motion/react";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "RECRUITER" as "RECRUITER" | "CANDIDATE",
    companyName: "",
  });
  const controls = useAnimationControls();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiRequest<{
        user: {
          id: string;
          name: string;
          email: string;
          role: "RECRUITER" | "CANDIDATE" | "ADMIN";
        };
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          // Only send companyName for recruiters; omit entirely for candidates
          companyName: form.role === "RECRUITER" && form.companyName.trim()
            ? form.companyName.trim()
            : undefined,
        }),
      });

      setAuth(data.user);
      toast.success("Account created!", {
        description: `Welcome, ${data.user.name}`,
      });

      if (data.user.role === "RECRUITER") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (error: unknown) {
      toast.error("Registration failed", {
        description: (error as Error).message,
      });
      controls.start({
        x: [-10, 10, -8, 8, -5, 5, 0],
        transition: { duration: 0.4 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <motion.div animate={controls}>
          <Card className="w-full">
            <CardHeader className="space-y-1">
              <Logo />
              <CardTitle className="text-2xl mt-4">Create account</CardTitle>
              <CardDescription>Get started with TokenHire</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: "RECRUITER" })}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        form.role === "RECRUITER"
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-border text-muted-foreground hover:border-blue-500/50"
                      }`}
                    >
                      Recruiter
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: "CANDIDATE" })}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        form.role === "CANDIDATE"
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : "border-border text-muted-foreground hover:border-blue-500/50"
                      }`}
                    >
                      Candidate
                    </button>
                  </div>
                </div>
                {/* Company name — only shown for recruiters */}
                {form.role === "RECRUITER" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="companyName">Company name</Label>
                    <Input
                      id="companyName"
                      placeholder="Acme Corp"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    />
                  </motion.div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-500 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
