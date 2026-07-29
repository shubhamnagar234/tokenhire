"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { MagneticButton } from "@/components/ui/magnetic-button";

export function HeroSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center px-6 text-center gap-8"
    >
      <div className="space-y-4 max-w-2xl">
        <motion.div variants={item}>
          <div className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm">
            The future of technical hiring
          </div>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-5xl md:text-6xl font-bold leading-tight"
        >
          Hire engineers who use{" "}
          <AnimatedGradientText>AI efficiently</AnimatedGradientText>
        </motion.h1>

        <motion.p
          variants={item}
          className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto"
        >
          TokenHire gives every candidate the same AI token budget. How
          efficiently they use it — alongside correctness and speed — determines
          their rank.
        </motion.p>
      </div>

      <motion.div
        variants={item}
        className="flex items-center gap-4 relative z-10"
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
    </motion.div>
  );
}
