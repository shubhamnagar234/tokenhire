"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/hooks/useHydrated";

interface FlickeringGridProps {
  className?: string;
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number; // 0 to 1
  color?: string;
}

export function FlickeringGrid({
  className = "",
  squareSize = 40,
  gridGap = 1,
  flickerChance = 0.05,
  color = "rgba(59, 130, 246, 0.2)", // blue-500 with opacity
}: FlickeringGridProps) {
  const hydrated = useHydrated();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!hydrated) return;
    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, [hydrated]);

  const [squares, setSquares] = useState<
    { id: number; x: number; y: number; delay: number; duration: number }[]
  >([]);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const cols = Math.floor(dimensions.width / (squareSize + gridGap));
    const rows = Math.floor(dimensions.height / (squareSize + gridGap));

    const totalSquares = cols * rows;
    const activeSquares: {
      id: number;
      x: number;
      y: number;
      delay: number;
      duration: number;
    }[] = [];

    for (let i = 0; i < totalSquares; i++) {
      if (Math.random() < flickerChance) {
        const x = (i % cols) * (squareSize + gridGap);
        const y = Math.floor(i / cols) * (squareSize + gridGap);
        activeSquares.push({
          id: i,
          x,
          y,
          delay: Math.random() * 2,
          duration: Math.random() * 2 + 2,
        });
      }
    }
    // Wrap in setTimeout to avoid synchronous setState inside useEffect warning
    const timeout = setTimeout(() => {
      setSquares(activeSquares);
    }, 0);

    return () => clearTimeout(timeout);
  }, [dimensions, squareSize, gridGap, flickerChance]);

  if (!hydrated || !dimensions.width) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width={squareSize + gridGap}
            height={squareSize + gridGap}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${squareSize} 0 L 0 0 0 ${squareSize}`}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.03)"
              strokeWidth={gridGap}
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {squares.map((sq) => (
          <motion.rect
            key={sq.id}
            x={sq.x}
            y={sq.y}
            width={squareSize}
            height={squareSize}
            fill={color}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: sq.duration,
              repeat: Infinity,
              delay: sq.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </svg>
      {/* Soft gradient mask to fade the grid out at the edges */}
      <div className="absolute inset-0 bg-background mask-[radial-gradient(ellipse_at_center,transparent_20%,black_100%)]" />
    </div>
  );
}
