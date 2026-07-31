"use client";

import { motion } from "motion/react";

export function TechMarquee() {
  const technologies = [
    { name: "React", icon: "⚛️" },
    { name: "Python", icon: "🐍" },
    { name: "Node.js", icon: "🟩" },
    { name: "TypeScript", icon: "📘" },
    { name: "C++", icon: "⚙️" },
    { name: "Java", icon: "☕" },
    { name: "Go", icon: "🐹" },
    { name: "Rust", icon: "🦀" },
    { name: "SQL", icon: "🗄️" },
    { name: "Docker", icon: "🐳" },
  ];

  // Duplicate the array so it can loop seamlessly
  const duplicatedTech = [...technologies, ...technologies, ...technologies];

  return (
    <div className="w-full overflow-hidden bg-background py-10 border-y border-border/50 relative">
      {/* Fade masks on edges */}
      <div className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-background to-transparent z-10" />

      <div className="max-w-375 mx-auto w-full flex flex-col items-center gap-6">
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">
          Evaluate candidates across any stack
        </p>

        <div className="flex w-[200vw] sm:w-[150vw] md:w-[120vw] lg:w-screen">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 20, // Adjust speed here
            }}
          >
            {duplicatedTech.map((tech, i) => (
              <div
                key={`${tech.name}-${i}`}
                className="flex items-center gap-2 px-6 py-3 bg-secondary/30 border border-border/50 rounded-full text-sm font-medium whitespace-nowrap shrink-0 hover:bg-secondary/50 transition-colors cursor-default"
              >
                <span className="text-xl">{tech.icon}</span>
                <span>{tech.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
