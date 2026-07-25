"use client";

import { motion } from "motion/react";

export function AnimatedGradientText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={`inline-block bg-linear-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent bg-size-[200%_auto] ${className}`}
      animate={{
        backgroundPosition: ["0% center", "200% center"],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}
