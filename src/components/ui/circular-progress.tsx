"use client";

import { motion } from "motion/react";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { NumberTicker } from "./number-ticker";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 200,
  strokeWidth = 12,
  className = "",
}: CircularProgressProps) {
  const mounted = useHydrated();

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  const colorClass =
    percentage >= 0.7
      ? "text-green-500"
      : percentage >= 0.4
        ? "text-yellow-500"
        : "text-red-500";

  const glowColor =
    percentage >= 0.7
      ? "rgba(34, 197, 94, 0.4)" // green
      : percentage >= 0.4
        ? "rgba(234, 179, 8, 0.4)" // yellow
        : "rgba(239, 68, 68, 0.4)"; // red

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background Circle */}
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary/50"
        />
        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorClass}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: mounted ? strokeDashoffset : circumference,
          }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 8px ${glowColor})`,
          }}
        />
      </svg>
      {/* Inner Content (Score) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-6xl font-bold ${colorClass}`}>
          {mounted ? <NumberTicker value={value} /> : 0}
        </span>
      </div>
    </div>
  );
}
