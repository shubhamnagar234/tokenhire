"use client";

import { motion } from "motion/react";
import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className = "",
  size = 200,
  duration = 8,
  colorFrom = "#3b82f6", // blue-500
  colorTo = "#a855f7",   // purple-500
}: BorderBeamProps) {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[inherit] ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: duration,
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 mix-blend-screen"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(from 0deg, transparent 70%, ${colorFrom} 85%, ${colorTo} 100%)`,
        }}
      />
    </div>
  );
}
