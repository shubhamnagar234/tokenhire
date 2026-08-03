"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { BlurTextReveal } from "@/components/ui/blur-text-reveal";

export function HeroSection() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center gap-8 min-h-[50vh]">
      <div className="space-y-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Badge
            variant="secondary"
            className="px-4 py-1.5 text-sm rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
          >
            The future of technical hiring
          </Badge>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mt-4">
          <BlurTextReveal text="Hire engineers who use " delay={0.3} />
          <BlurTextReveal
            text={<AnimatedGradientText>AI efficiently</AnimatedGradientText>}
            delay={0.8}
          />
        </h1>

        <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto mt-6">
          <BlurTextReveal
            text="TokenHire gives every candidate the same AI token budget. How efficiently they use it — alongside correctness and speed — determines their rank."
            delay={1.2}
          />
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="flex items-center gap-4 relative z-10 mt-4"
      >
        <Link href="/register">
          <MagneticButton>
            <Button size="lg" className="px-8">
              Start hiring
            </Button>
          </MagneticButton>
        </Link>
        <Link href="/login">
          <MagneticButton>
            <Button size="lg" variant="outline" className="px-8">
              Sign in
            </Button>
          </MagneticButton>
        </Link>
      </motion.div>
    </div>
  );
}
