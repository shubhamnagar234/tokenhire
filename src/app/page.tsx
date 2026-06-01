import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-lg">TokenHire</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
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

        {/* Three pillars */}
        <div className="grid grid-cols-3 gap-6 max-w-3xl mt-4">
          {[
            {
              icon: "⚡",
              title: "Same AI for everyone",
              desc: "Every candidate gets identical token budget. No unfair advantage.",
            },
            {
              icon: "📊",
              title: "Token efficiency score",
              desc: "Candidates who solve problems with fewer AI calls rank higher.",
            },
            {
              icon: "🎯",
              title: "Adjustable weights",
              desc: "Set your own scoring formula — optimise for speed, correctness, or efficiency.",
            },
          ].map((p) => (
            <div
              key={p.title}
              className="border border-border rounded-xl p-5 text-left space-y-2 hover:border-blue-500/50 transition-colors"
            >
              <span className="text-2xl">{p.icon}</span>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-border text-center text-sm text-muted-foreground">
        Built by Shubham Nagar · Full Stack AI Engineer
      </footer>
    </div>
  )
}