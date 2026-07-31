"use client";

import { motion } from "motion/react";
import React from "react";

export function AuroraBackground({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col h-screen w-full items-center justify-center bg-background overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Aurora Orbs */}
        <motion.div
          animate={{
            x: ["0%", "10%", "-10%", "0%"],
            y: ["0%", "-10%", "10%", "0%"],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-1/4 -left-1/4 w-[50vw] h-[50vw] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div
          animate={{
            x: ["0%", "-15%", "10%", "0%"],
            y: ["0%", "15%", "-10%", "0%"],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute top-1/4 -right-1/4 w-[60vw] h-[60vw] bg-indigo-500/15 rounded-full blur-[130px] mix-blend-screen"
        />
        <motion.div
          animate={{
            x: ["0%", "20%", "-20%", "0%"],
            y: ["0%", "-20%", "20%", "0%"],
            scale: [1, 1.3, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          className="absolute -bottom-1/4 left-1/4 w-[55vw] h-[55vw] bg-purple-500/15 rounded-full blur-[140px] mix-blend-screen"
        />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full flex justify-center items-center">
        {children}
      </div>
    </div>
  );
}
