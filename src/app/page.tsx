"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { TokenScrollSimulation } from "@/components/marketing/TokenScrollSimulation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/logo";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { MagneticButton } from "@/components/ui/magnetic-button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border"
      >
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link href="/register">
            <MagneticButton>
              <Button size="sm">Get Started</Button>
            </MagneticButton>
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 py-16 relative">
        {/* The Flickering Grid acts as an immersive tech background */}
        <FlickeringGrid
          color="rgba(59, 130, 246, 0.06)" // Much more subtle opacity
          squareSize={50} // Larger squares feel more premium and less noisy
          flickerChance={0.03} // Fewer flickering squares at once
        />

        <HeroSection />
        <div className="mt-24 mb-12">
          <TokenScrollSimulation />
        </div>
        <FeaturesSection />
      </main>

      <footer className="px-6 py-4 border-t border-border text-center text-sm text-muted-foreground">
        Built by Shubham Nagar · Full Stack AI Engineer
      </footer>
    </div>
  );
}
