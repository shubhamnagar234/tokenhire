import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center gap-8">
      <div className="space-y-4 max-w-2xl">
        <div className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm">
          The future of technical hiring
        </div>
        <h1 className="text-5xl font-bold leading-tight">
          Hire engineers who use{" "}
          <span className="text-blue-400">AI efficiently</span>
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          TokenHire gives every candidate the same AI token budget.
          How efficiently they use it — alongside correctness and speed —
          determines their rank.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/register">
          <Button size="lg" className="px-8">
            Start hiring
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline" className="px-8">
            Sign in
          </Button>
        </Link>
      </div>
    </div>
  )
}
