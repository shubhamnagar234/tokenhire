"use client";

import { motion } from "motion/react";
import React, { useMemo } from "react";

export function BlurTextReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  // If text is a string, split by words. If it's a React element, just render it wrapped.
  const content = useMemo(() => {
    if (typeof text === "string") {
      const words = text.split(/(\s+)/);
      return words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { filter: "blur(10px)", opacity: 0, y: 10 },
            visible: { filter: "blur(0px)", opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-block"
        >
          {word === "\n" ? <br /> : word}
        </motion.span>
      ));
    }
    // If it's JSX (like AnimatedGradientText), just animate the whole thing as one block
    return (
      <motion.span
        variants={{
          hidden: { filter: "blur(10px)", opacity: 0, y: 10 },
          visible: { filter: "blur(0px)", opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="inline-block"
      >
        {text}
      </motion.span>
    );
  }, [text]);

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {content}
    </motion.span>
  );
}
