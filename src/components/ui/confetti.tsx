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
  angle: number;
  velocity: number;
  rotation: number;
}

export function Confetti() {
  const hydrated = useHydrated();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!hydrated) return;

    // Generate 40 random confetti particles
    const newParticles: Particle[] = Array.from({ length: 45 }).map((_, i) => {
      const angle = (Math.random() * 80 + 50) * (Math.PI / 180); // 50 to 130 degrees upward
      const velocity = Math.random() * 350 + 200;
      return {
        id: i,
        x: 50, // start from bottom center (50vw)
        y: 100, // 100vh
        size: Math.random() * 8 + 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle,
        velocity,
        rotation: Math.random() * 720 - 360,
      };
    });

    setParticles(newParticles);
  }, [hydrated]);

  if (!hydrated || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => {
        // Calculate end positions based on angle and physics-like spread
        const endX = p.x + Math.cos(p.angle) * (p.velocity * 0.15) * (Math.random() > 0.5 ? 1 : -1);
        const endY = p.y - Math.sin(p.angle) * (p.velocity * 0.2) + 60; // shoot up then drop

        return (
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
              left: `${Math.max(5, Math.min(95, endX))}vw`,
              top: `${endY}vh`,
              scale: [0, 1.2, 0.8, 0],
              rotate: p.rotation,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 1.5 + 2,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size * 1.4,
              backgroundColor: p.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        );
      })}
    </div>
  );
}
