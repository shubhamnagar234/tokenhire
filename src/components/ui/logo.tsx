"use client";

import { motion } from "motion/react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({
  className = "",
  size = "md",
  showText = true,
}: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-xl",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const dotSizeClasses = {
    sm: "w-1 h-1 -top-0.5",
    md: "w-1.5 h-1.5 -top-1",
    lg: "w-2 h-2 -top-1",
  };

  return (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {!showText ? (
        <div
          className={`${sizeClasses[size]} bg-foreground rounded-md flex items-center justify-center`}
        >
          <span className="text-background font-bold font-sans">T</span>
        </div>
      ) : (
        <span
          className={`font-bold font-sans tracking-tighter flex items-baseline text-foreground ${textSizeClasses[size]}`}
        >
          TokenH
          <span className="relative inline-flex flex-col items-center justify-center">
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute bg-blue-500 rounded-full ${dotSizeClasses[size]}`}
              style={{
                boxShadow: "0 0 12px 2px rgba(59,130,246,0.8)",
              }}
            />
            <span>ı</span>
          </span>
          re
        </span>
      )}
    </motion.div>
  );
}
