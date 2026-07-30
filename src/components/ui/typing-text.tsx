"use client";

import { motion } from "motion/react";
import { useMemo } from "react";

export function TypingText({
  text,
  className = "",
  speed = 0.015, // Delay between each chunk (in seconds)
}: {
  text: string;
  className?: string;
  speed?: number;
}) {
  // Split by words, preserving whitespace
  const words = useMemo(() => {
    return text.split(/(\s+)/);
  }, [text]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: speed,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 2 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.1 },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={childVariants} className="inline-block">
          {word === "\n" ? <br /> : word}
        </motion.span>
      ))}
    </motion.span>
  );
}
