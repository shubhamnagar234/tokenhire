import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { TokenScrollSimulation } from "@/components/marketing/TokenScrollSimulation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/ui/logo";

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
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </motion.header>

      <main className="flex-1 py-16">
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
