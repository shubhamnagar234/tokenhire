"use client";

import { motion } from "motion/react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export function FeaturesSection() {
  const pillars = [
    {
      icon: "⚡",
      title: "Same AI for everyone",
      desc: "Every candidate gets identical token budget. No unfair advantage.",
    },
    {
      icon: "📊",
      title: "Token efficiency score",
      desc: "Candidates who solve problems with fewer AI calls rank higher.",
    },
    {
      icon: "🎯",
      title: "Adjustable weights",
      desc: "Set your own scoring formula — optimise for speed, correctness, or efficiency.",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
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
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12 px-6"
    >
      {pillars.map((p) => (
        <motion.div
          variants={item}
          key={p.title}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="h-full"
        >
          <SpotlightCard className="h-full p-6 text-left space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center text-2xl relative z-10">
              {p.icon}
            </div>
            <h3 className="font-semibold text-lg relative z-10">{p.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
              {p.desc}
            </p>
          </SpotlightCard>
        </motion.div>
      ))}
    </motion.div>
  );
}
