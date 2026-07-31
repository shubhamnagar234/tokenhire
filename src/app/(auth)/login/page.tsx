"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Label } from "@/components/ui/label";
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
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
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
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setAuth(data.user);

      toast.success("Welcome back!", {
        description: `Logged in as ${data.user.name}`,
      });

      if (data.user.role === "RECRUITER") {
        router.push("/dashboard");
      } else {
        router.push("/candidate");
      }
    } catch (error: unknown) {
      toast.error("Login failed", { description: (error as Error).message });
      controls.start({
        x: [-10, 10, -8, 8, -5, 5, 0],
        transition: { duration: 0.4 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <motion.div animate={controls}>
          <Card className="w-full bg-background/80 backdrop-blur-xl border-border/50 shadow-2xl">
            <CardHeader className="space-y-1">
              <Logo />
              <CardTitle className="text-2xl mt-4">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">
                  Don&apos;t have an account?{" "}
                </span>
                <Link
                  href="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AuroraBackground>
  );
}
