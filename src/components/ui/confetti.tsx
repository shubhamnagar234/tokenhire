"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/hooks/useHydrated";

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
];

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  endX: number;
  endY: number;
  duration: number;
  borderRadius: string;
}

export function Confetti() {
  const hydrated = useHydrated();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!hydrated) return;

    // Generate random confetti particles with precomputed trajectories for pure rendering
    const newParticles: Particle[] = Array.from({ length: 45 }).map((_, i) => {
      const angle = (Math.random() * 80 + 50) * (Math.PI / 180); // 50 to 130 degrees upward
      const velocity = Math.random() * 350 + 200;
      const x = 50; // start from bottom center (50vw)
      const y = 100; // 100vh
      const direction = Math.random() > 0.5 ? 1 : -1;
      const calculatedEndX =
        x + Math.cos(angle) * (velocity * 0.15) * direction;
      const calculatedEndY = y - Math.sin(angle) * (velocity * 0.2) + 60;

      return {
        id: i,
        x,
        y,
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 720 - 360,
        endX: Math.max(5, Math.min(95, calculatedEndX)),
        endY: calculatedEndY,
        duration: Math.random() * 1.5 + 2,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      };
    });

    const timer = setTimeout(() => {
      setParticles(newParticles);
    }, 0);

    return () => clearTimeout(timer);
  }, [hydrated]);

  if (!hydrated || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            scale: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            left: `${p.endX}vw`,
            top: `${p.endY}vh`,
            scale: [0, 1.2, 0.8, 0],
            rotate: p.rotation,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            borderRadius: p.borderRadius,
          }}
        />
      ))}
    </div>
  );
}
