"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function TokenScrollSimulation() {
  const [demo, setDemo] = useState({
    score: 87.5,
    tokensUsed: 700,
    tokensRemaining: 300,
    tokenPct: 30,
    speedPct: 80,
    candidateId: 402,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenBarRef = useRef<HTMLDivElement>(null);
  const aiPopupRef = useRef<HTMLDivElement>(null);
  const scorePopupRef = useRef<HTMLDivElement>(null);
  const tokenCountRef = useRef<HTMLSpanElement>(null);
  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);
  const text3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Generate randomized candidate data on mount
    const tRem = Math.floor(Math.random() * 500) + 150; // 150 to 650 tokens remaining
    const tUsed = 1000 - tRem;
    const tPct = Math.round((tRem / 1000) * 100);
    const sPct = Math.floor(Math.random() * 30) + 65; // 65 to 95 speed
    const finalScore =
      Math.round((100 * 0.5 + sPct * 0.2 + tPct * 0.3) * 10) / 10;
    const candId = Math.floor(Math.random() * 900) + 100; // 100 to 999

    Promise.resolve().then(() => {
      setDemo({
        score: finalScore,
        tokensUsed: tUsed,
        tokensRemaining: tRem,
        tokenPct: tPct,
        speedPct: sPct,
        candidateId: candId,
      });
    });

    const tokenColor =
      tPct > 50 ? "#22c55e" : tPct > 25 ? "#eab308" : "#ef4444";

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top", // Pin when the top of the container hits the top of the viewport
        end: "+=2500", // Scroll for 2500px while pinned
        scrub: 1, // Smooth scrubbing (takes 1s to catch up)
        pin: true,
      },
    });

    // Initially hide elements
    gsap.set(
      [
        text2Ref.current,
        text3Ref.current,
        aiPopupRef.current,
        scorePopupRef.current,
        ".code-line-final",
      ],
      { opacity: 0, y: 20 },
    );
    gsap.set(".code-line", { opacity: 0, x: -10 });
    gsap.set(".editor-window", { opacity: 0, scale: 0.95 });

    // Scene 1: Editor appears, text 1 fades in
    tl.to(".editor-window", { opacity: 1, scale: 1, duration: 1 }).fromTo(
      text1Ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1 },
      "<",
    );

    // Typing code
    const lines = gsap.utils.toArray(".code-line") as HTMLElement[];
    lines.forEach((line) => {
      tl.to(line, { opacity: 1, x: 0, duration: 0.3 });
    });

    // Transition to Scene 2: Text 1 out, Text 2 in
    tl.to(text1Ref.current, { opacity: 0, y: -20, duration: 1 }).to(
      text2Ref.current,
      { opacity: 1, y: 0, duration: 1 },
      "<",
    );

    // Scene 2: AI Assistance & Token Drain
    tl.to(".ask-ai-btn", { scale: 0.95, duration: 0.2 })
      .to(".ask-ai-btn", { scale: 1, duration: 0.2 })
      .to(aiPopupRef.current, { opacity: 1, y: 0, duration: 1 });

    // Drain token bar from green to yellow/red
    tl.to(
      tokenBarRef.current,
      { width: `${tPct}%`, backgroundColor: tokenColor, duration: 2 },
      "<",
    );

    // Animate token counter
    tl.to(
      tokenCountRef.current,
      {
        innerText: tRem,
        duration: 2,
        snap: { innerText: 1 },
        onUpdate: function () {
          if (tokenCountRef.current) {
            tokenCountRef.current.innerText = Math.round(
              Number(this.targets()[0].innerText),
            ).toString();
          }
        },
      },
      "<",
    );

    // AI fixes the code
    tl.to(".code-line-final", { opacity: 1, y: 0, duration: 1 });

    // Transition to Scene 3: Text 2 out, Text 3 in
    tl.to(text2Ref.current, { opacity: 0, y: -20, duration: 1 }).to(
      text3Ref.current,
      { opacity: 1, y: 0, duration: 1 },
      "<",
    );

    // Scene 3: Final Score Popup
    tl.to(".editor-window", { opacity: 0.2, scale: 0.95, duration: 1 })
      .to(aiPopupRef.current, { opacity: 0, duration: 0.5 }, "<")
      .to(
        scorePopupRef.current,
        { opacity: 1, y: 0, scale: 1, duration: 1 },
        "<",
      );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen w-full bg-background flex items-center justify-center overflow-hidden border-t border-b border-border relative"
    >
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl w-full px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Side: Scrollytelling Text */}
        <div className="relative h-[300px] flex items-center">
          <div
            ref={text1Ref}
            className="absolute inset-0 flex flex-col justify-center space-y-4"
          >
            <h2 className="text-4xl font-bold">Watch them work.</h2>
            <p className="text-xl text-muted-foreground">
              As candidates solve problems, they can use our built-in AI
              assistant. But every prompt costs tokens.
            </p>
          </div>

          <div
            ref={text2Ref}
            className="absolute inset-0 flex flex-col justify-center space-y-4"
          >
            <h2 className="text-4xl font-bold">The Token Budget.</h2>
            <p className="text-xl text-muted-foreground">
              A physical limit on AI dependence. Watch the budget drain. Will
              they exhaust it immediately, or use it surgically?
            </p>
          </div>

          <div
            ref={text3Ref}
            className="absolute inset-0 flex flex-col justify-center space-y-4"
          >
            <h2 className="text-4xl font-bold">The True Score.</h2>
            <p className="text-xl text-muted-foreground">
              Correctness isn&apos;t enough anymore. We rank engineers by a
              composite score of speed, accuracy, and AI efficiency.
            </p>
          </div>
        </div>

        {/* Right Side: Visual Simulation */}
        <div className="relative h-[450px]">
          {/* Editor Window */}
          <div className="editor-window absolute inset-0 dark:bg-[#0d1117] bg-white border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Editor Header */}
            <div className="dark:bg-[#161b22] bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Tokens: <span ref={tokenCountRef}>1000</span>/1000
                </span>
                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    ref={tokenBarRef}
                    className="h-full bg-green-500"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div className="ask-ai-btn px-3 py-1 bg-blue-600 text-white text-xs rounded shadow-sm font-medium">
                Ask AI
              </div>
            </div>

            {/* Editor Body */}
            <div className="p-5 font-mono text-sm space-y-3 dark:text-gray-300 text-gray-700">
              <div className="code-line">
                <span className="dark:text-purple-400 text-purple-600">vector</span>&#60;
                <span className="dark:text-purple-400 text-purple-600">int</span>&#62;{" "}
                <span className="dark:text-blue-400 text-blue-600">twoSum</span>(vector&#60;
                <span className="dark:text-purple-400 text-purple-600">int</span>&#62;&amp; nums,{" "}
                <span className="dark:text-purple-400 text-purple-600">int</span> target) {"{"}
              </div>
              <div className="code-line pl-4">
                <span className="text-muted-foreground">
                  {"// I need to optimize this O(n^2) loop..."}
                </span>
              </div>
              <div className="code-line pl-4">
                <span className="dark:text-purple-400 text-purple-600">for</span>(
                <span className="dark:text-purple-400 text-purple-600">int</span> i ={" "}
                <span className="dark:text-orange-400 text-orange-600">0</span>; i &#60; nums.size();
                i++) {"{"}
              </div>
              <div className="code-line pl-8">
                <span className="dark:text-purple-400 text-purple-600">for</span>(
                <span className="dark:text-purple-400 text-purple-600">int</span> j = i +{" "}
                <span className="dark:text-orange-400 text-orange-600">1</span>; j &#60; nums.size();
                j++) {"{"}
              </div>
              <div className="code-line pl-12">
                <span className="dark:text-purple-400 text-purple-600">if</span>(nums[i] + nums[j] ==
                target) <span className="dark:text-purple-400 text-purple-600">return</span> {"{"}i,
                j{"}"};
              </div>
              <div className="code-line pl-8">{"}"}</div>
              <div className="code-line pl-4">{"}"}</div>
              <div className="code-line-final pl-4 dark:text-green-400 text-green-700 bg-green-500/10 py-1 -mx-2 px-2 border-l-2 dark:border-green-400 border-green-600">
                {
                  "// AI optimized: Use unordered_map to achieve O(n) time complexity"
                }
              </div>
              <div className="code-line">{"}"}</div>
            </div>
          </div>

          {/* AI Popup */}
          <div
            ref={aiPopupRef}
            className="absolute -right-8 top-[120px] w-64 bg-secondary/95 backdrop-blur border border-border rounded-lg shadow-xl p-4 z-20"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✨</span>
              <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Instead of a nested loop, you can use `std::unordered_map` to
              store complements and solve this in O(n) time.
            </p>
            <div className="mt-3 text-[10px] text-red-400 font-medium bg-red-500/10 inline-block px-2 py-1 rounded">
              - {demo.tokensUsed} tokens used
            </div>
          </div>

          {/* Final Score Popup */}
          <div
            ref={scorePopupRef}
            className="absolute inset-0 m-auto w-72 h-fit bg-background/95 backdrop-blur border border-blue-500/50 rounded-xl shadow-2xl p-6 z-30 flex flex-col items-center justify-center text-center transform scale-90"
          >
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="font-bold text-lg mb-1">Test Completed</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Candidate #{demo.candidateId}
            </p>

            <div className="text-6xl font-black text-blue-400 mb-2">
              {demo.score}
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-6">
              Composite Score
            </p>

            <div className="w-full space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-xs font-medium">
                <span>Correctness</span>
                <span className="text-green-400">100%</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span>Speed</span>
                <span className="text-yellow-400">{demo.speedPct}%</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span>AI Efficiency</span>
                <span className="text-red-400">{demo.tokenPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
