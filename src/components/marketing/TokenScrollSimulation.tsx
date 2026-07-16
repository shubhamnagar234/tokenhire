"use client";

import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";

export function TokenScrollSimulation() {
  const demo = {
    score: 87.5,
    tokensUsed: 700,
    tokensRemaining: 300,
    tokenPct: 30,
    speedPct: 80,
    candidateId: 402,
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll progress through the 300vh container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // --- SCENE MAPPINGS (0 to 1 scroll progress) ---

  // Text 1: Fade in (0-0.1), hold, fade out (0.25-0.35)
  const text1Opacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.25, 0.35],
    [0, 1, 1, 0],
  );
  const text1Y = useTransform(
    scrollYProgress,
    [0, 0.1, 0.25, 0.35],
    [20, 0, 0, -20],
  );

  // Text 2: Fade in (0.35-0.45), hold, fade out (0.65-0.75)
  const text2Opacity = useTransform(
    scrollYProgress,
    [0.35, 0.45, 0.65, 0.75],
    [0, 1, 1, 0],
  );
  const text2Y = useTransform(
    scrollYProgress,
    [0.35, 0.45, 0.65, 0.75],
    [20, 0, 0, -20],
  );

  // Text 3: Fade in (0.75-0.85), hold to end
  const text3Opacity = useTransform(
    scrollYProgress,
    [0.75, 0.85, 1],
    [0, 1, 1],
  );
  const text3Y = useTransform(scrollYProgress, [0.75, 0.85, 1], [20, 0, 0]);

  // Editor Window: Fade in (0-0.1), fade out slightly at the end (0.8-0.9)
  const editorOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.8, 0.9],
    [0, 1, 1, 0.3],
  );
  const editorScale = useTransform(
    scrollYProgress,
    [0, 0.1, 0.8, 0.9],
    [0.95, 1, 1, 0.95],
  );

  // Code typing (0.1 to 0.25)
  const codeAnims = [
    {
      op: useTransform(scrollYProgress, [0.1, 0.12], [0, 1]),
      x: useTransform(scrollYProgress, [0.1, 0.12], [-10, 0]),
    },
    {
      op: useTransform(scrollYProgress, [0.115, 0.135], [0, 1]),
      x: useTransform(scrollYProgress, [0.115, 0.135], [-10, 0]),
    },
    {
      op: useTransform(scrollYProgress, [0.13, 0.15], [0, 1]),
      x: useTransform(scrollYProgress, [0.13, 0.15], [-10, 0]),
    },
    {
      op: useTransform(scrollYProgress, [0.145, 0.165], [0, 1]),
      x: useTransform(scrollYProgress, [0.145, 0.165], [-10, 0]),
    },
    {
      op: useTransform(scrollYProgress, [0.16, 0.18], [0, 1]),
      x: useTransform(scrollYProgress, [0.16, 0.18], [-10, 0]),
    },
    {
      op: useTransform(scrollYProgress, [0.175, 0.195], [0, 1]),
      x: useTransform(scrollYProgress, [0.175, 0.195], [-10, 0]),
    },
    {
      op: useTransform(scrollYProgress, [0.19, 0.21], [0, 1]),
      x: useTransform(scrollYProgress, [0.19, 0.21], [-10, 0]),
    },
    {
      op: useTransform(scrollYProgress, [0.205, 0.225], [0, 1]),
      x: useTransform(scrollYProgress, [0.205, 0.225], [-10, 0]),
    },
  ];

  // AI Assistance & Drain (0.45 to 0.6)
  const aiPopupOpacity = useTransform(
    scrollYProgress,
    [0.45, 0.55, 0.8, 0.9],
    [0, 1, 1, 0],
  );
  const aiPopupY = useTransform(scrollYProgress, [0.45, 0.55], [20, 0]);

  // Token Bar
  const tokenBarPctRaw = useTransform(
    scrollYProgress,
    [0.45, 0.6],
    [100, demo.tokenPct],
  );
  const tokenCountRaw = useTransform(
    scrollYProgress,
    [0.45, 0.6],
    [1000, demo.tokensRemaining],
  );
  const [displayedTokenCount, setDisplayedTokenCount] = useState(1000);
  const [tokenBarPct, setTokenBarPct] = useState(100);

  useMotionValueEvent(tokenCountRaw, "change", (latest) =>
    setDisplayedTokenCount(Math.round(latest)),
  );
  useMotionValueEvent(tokenBarPctRaw, "change", (latest) =>
    setTokenBarPct(latest),
  );

  const tokenColor =
    tokenBarPct > 50 ? "#22c55e" : tokenBarPct > 25 ? "#eab308" : "#ef4444";

  // AI fixes code (0.55 to 0.65)
  const codeFinalOpacity = useTransform(scrollYProgress, [0.55, 0.65], [0, 1]);
  const codeFinalY = useTransform(scrollYProgress, [0.55, 0.65], [10, 0]);

  // Final Score Popup (0.8 to 0.9)
  const scorePopupOpacity = useTransform(scrollYProgress, [0.8, 0.9], [0, 1]);
  const scorePopupScale = useTransform(scrollYProgress, [0.8, 0.9], [0.9, 1]);
  const scorePopupY = useTransform(scrollYProgress, [0.8, 0.9], [20, 0]);

  // Demo values static state (no randomization to avoid hydration mismatch and setState in useEffect)

  const DesktopSimulation = (
    <div className="max-w-6xl w-full px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
      {/* Left Side: Scrollytelling Text */}
      <div className="relative md:h-[300px] flex flex-col items-start">
        <motion.div
          style={{ opacity: text1Opacity, y: text1Y }}
          className="absolute inset-0 flex flex-col justify-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">Watch them work.</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            As candidates solve problems, they can use our built-in AI
            assistant. But every prompt costs tokens.
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: text2Opacity, y: text2Y }}
          className="absolute inset-0 flex flex-col justify-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">The Token Budget.</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            A physical limit on AI dependence. Watch the budget drain. Will they
            exhaust it immediately, or use it surgically?
          </p>
        </motion.div>

        <motion.div
          style={{ opacity: text3Opacity, y: text3Y }}
          className="absolute inset-0 flex flex-col justify-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">The True Score.</h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Correctness isn&apos;t enough anymore. We rank engineers by a
            composite score of speed, accuracy, and AI efficiency.
          </p>
        </motion.div>
      </div>

      {/* Right Side: Visual Simulation */}
      <div className="relative h-[450px]">
        {/* Editor Window */}
        <motion.div
          style={{ opacity: editorOpacity, scale: editorScale }}
          className="absolute inset-0 dark:bg-[#0d1117] bg-white border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Editor Header */}
          <div className="dark:bg-[#161b22] bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Tokens: <span>{displayedTokenCount}</span>/1000
              </span>
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{
                    width: `${tokenBarPct}%`,
                    backgroundColor: tokenColor,
                  }}
                />
              </div>
            </div>

            <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded shadow-sm font-medium">
              Ask AI
            </div>
          </div>

          {/* Editor Body */}
          <div className="p-5 font-mono text-sm space-y-3 dark:text-gray-300 text-gray-700">
            <motion.div style={{ opacity: codeAnims[0].op, x: codeAnims[0].x }}>
              <span className="dark:text-purple-400 text-purple-600">
                vector
              </span>
              &#60;
              <span className="dark:text-purple-400 text-purple-600">int</span>
              &#62;{" "}
              <span className="dark:text-blue-400 text-blue-600">twoSum</span>
              (vector&#60;
              <span className="dark:text-purple-400 text-purple-600">int</span>
              &#62;&amp; nums,{" "}
              <span className="dark:text-purple-400 text-purple-600">int</span>{" "}
              target) {"{"}
            </motion.div>
            <motion.div
              style={{ opacity: codeAnims[1].op, x: codeAnims[1].x }}
              className="pl-4"
            >
              <span className="text-muted-foreground">
                {"// I need to optimize this O(n^2) loop..."}
              </span>
            </motion.div>
            <motion.div
              style={{ opacity: codeAnims[2].op, x: codeAnims[2].x }}
              className="pl-4"
            >
              <span className="dark:text-purple-400 text-purple-600">for</span>(
              <span className="dark:text-purple-400 text-purple-600">int</span>{" "}
              i ={" "}
              <span className="dark:text-orange-400 text-orange-600">0</span>; i
              &#60; nums.size(); i++) {"{"}
            </motion.div>
            <motion.div
              style={{ opacity: codeAnims[3].op, x: codeAnims[3].x }}
              className="pl-8"
            >
              <span className="dark:text-purple-400 text-purple-600">for</span>(
              <span className="dark:text-purple-400 text-purple-600">int</span>{" "}
              j = i +{" "}
              <span className="dark:text-orange-400 text-orange-600">1</span>; j
              &#60; nums.size(); j++) {"{"}
            </motion.div>
            <motion.div
              style={{ opacity: codeAnims[4].op, x: codeAnims[4].x }}
              className="pl-12"
            >
              <span className="dark:text-purple-400 text-purple-600">if</span>
              (nums[i] + nums[j] == target){" "}
              <span className="dark:text-purple-400 text-purple-600">
                return
              </span>{" "}
              {"{"}i, j{"}"};
            </motion.div>
            <motion.div
              style={{ opacity: codeAnims[5].op, x: codeAnims[5].x }}
              className="pl-8"
            >
              {"}"}
            </motion.div>
            <motion.div
              style={{ opacity: codeAnims[6].op, x: codeAnims[6].x }}
              className="pl-4"
            >
              {"}"}
            </motion.div>
            <motion.div
              style={{ opacity: codeFinalOpacity, y: codeFinalY }}
              className="pl-4 dark:text-green-400 text-green-700 bg-green-500/10 py-1 -mx-2 px-2 border-l-2 dark:border-green-400 border-green-600"
            >
              {
                "// AI optimized: Use unordered_map to achieve O(n) time complexity"
              }
            </motion.div>
            <motion.div style={{ opacity: codeAnims[7].op, x: codeAnims[7].x }}>
              {"}"}
            </motion.div>
          </div>
        </motion.div>

        {/* AI Popup */}
        <motion.div
          style={{ opacity: aiPopupOpacity, y: aiPopupY }}
          className="absolute -right-8 top-[120px] w-64 bg-secondary/95 backdrop-blur border border-border rounded-lg shadow-xl p-4 z-20"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✨</span>
            <span className="font-semibold text-sm">AI Assistant</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Instead of a nested loop, you can use `std::unordered_map` to store
            complements and solve this in O(n) time.
          </p>
          <div className="mt-3 text-[10px] text-red-400 font-medium bg-red-500/10 inline-block px-2 py-1 rounded">
            - {demo.tokensUsed} tokens used
          </div>
        </motion.div>

        {/* Final Score Popup */}
        <motion.div
          style={{
            opacity: scorePopupOpacity,
            scale: scorePopupScale,
            y: scorePopupY,
          }}
          className="absolute inset-0 m-auto w-72 h-fit bg-background/95 backdrop-blur border border-blue-500/50 rounded-xl shadow-2xl p-6 z-30 flex flex-col items-center justify-center text-center"
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
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Version (Scroll-jacking) */}
      <div
        ref={containerRef}
        className="w-full relative hidden md:block"
        style={{ height: "300vh" }}
      >
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden border-t border-b border-border bg-background">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
          {DesktopSimulation}
        </div>
      </div>

      {/* Mobile Version (Simplified Static Flow using whileInView) */}
      <div className="w-full relative md:hidden py-16 border-t border-b border-border flex items-center justify-center overflow-hidden bg-background">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-6xl w-full px-6 flex flex-col gap-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl font-bold">Watch them work.</h2>
            <p className="text-lg text-muted-foreground">
              The ultimate candidate evaluation simulation.
            </p>
          </motion.div>

          {/* Simple static editor window for mobile, revealing all content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="w-full h-[400px] dark:bg-[#0d1117] bg-white border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden relative"
          >
            <div className="dark:bg-[#161b22] bg-muted/50 border-b border-border px-4 py-3 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Tokens: <span>{demo.tokensRemaining}</span>/1000
                </span>
                <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${demo.tokenPct}%`,
                      backgroundColor: tokenColor,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="text-6xl font-black text-blue-400">
                {demo.score}
              </div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Final Composite Score
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
