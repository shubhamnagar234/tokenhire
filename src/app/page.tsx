import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { TokenScrollSimulation } from "@/components/marketing/TokenScrollSimulation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-lg">TokenHire</span>
        </div>
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
      </header>

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
