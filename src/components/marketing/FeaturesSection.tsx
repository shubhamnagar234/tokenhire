"use client";

import { motion } from "motion/react";

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
          whileHover={{ scale: 1.02 }}
          className="border border-border rounded-xl p-5 text-left space-y-2 hover:border-blue-500/50 transition-colors bg-background"
        >
          <span className="text-2xl">{p.icon}</span>
          <h3 className="font-semibold">{p.title}</h3>
          <p className="text-sm text-muted-foreground">{p.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
