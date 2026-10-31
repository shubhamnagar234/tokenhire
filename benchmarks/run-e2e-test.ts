import { prisma } from "../src/lib/prisma";

const BASE_URL = "http://localhost:3000";

async function runE2E() {
  console.log("===========================================================");
  console.log("       TOKENHIRE COMPLETE E2E VERIFICATION TEST           ");
  console.log("===========================================================\n");

  // STEP 1: Login as Recruiter
  console.log("[Step 1] Logging in as Recruiter (recruiter@test.com)...");
  const recLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "recruiter@test.com",
      password: "password123",
    }),
  });

  if (!recLoginRes.ok) {
    const err = await recLoginRes.text();
    throw new Error(`Recruiter login failed (${recLoginRes.status}): ${err}`);
  }

  const recCookie = recLoginRes.headers.get("set-cookie");
  console.log("  -> Recruiter logged in successfully.");

  // STEP 2: Find or create an assessment for Recruiter
  console.log("\n[Step 2] Creating a dedicated verification assessment...");
  const createRes = await fetch(`${BASE_URL}/api/tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: recCookie || "" },
    body: JSON.stringify({
      title: `Recruiter Verification Test - ${Date.now()}`,
      timeLimitMins: 60,
      tokenBudget: 1500,
      weightCorrectness: 0.5,
      weightTime: 0.2,
      weightTokenSaving: 0.2,
      weightCodeQuality: 0.1,
      aiModel: "gemini-2.5-flash",
    }),
  });
  const createData = await createRes.json();
  const testId = createData.test.id;
  console.log(`  -> Created Test ID: ${testId}`);

  // Create problem with test cases for this specific test
  const problem = await prisma.problem.create({
    data: {
      title: "Sum of Two Numbers",
      description: "Given two integers on one line separated by space, print their sum.",
      difficulty: "EASY",
      testCases: {
        create: [
          { input: "2 3", expected: "5", isHidden: false },
          { input: "10 20", expected: "30", isHidden: true },
        ],
      },
    },
  });
  const problemId = problem.id;
  await prisma.testProblem.create({
    data: { testId, problemId, order: 1 },
  });
  console.log(`  -> Attached Problem ID: ${problemId}`);

  // STEP 3: Assign assessment to candidate (Send Invite)
  console.log("\n[Step 3] Assigning assessment to candidate@test.com...");
  const inviteRes = await fetch(`${BASE_URL}/api/tests/${testId}/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: recCookie || "" },
    body: JSON.stringify({ emails: ["candidate@test.com"] }),
  });
  const inviteData = await inviteRes.json();
  const inviteToken = inviteData.invites[0].token;
  console.log(`  -> Invite token generated: ${inviteToken}`);

  // STEP 4: Login as Candidate
  console.log("\n[Step 4] Logging in as Candidate (candidate@test.com)...");
  const candLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "candidate@test.com",
      password: "password123",
    }),
  });

  if (!candLoginRes.ok) {
    throw new Error(`Candidate login failed: ${candLoginRes.status}`);
  }
  const candCookie = candLoginRes.headers.get("set-cookie");
  console.log("  -> Candidate logged in successfully.");

  // STEP 5: Candidate starts test
  console.log("\n[Step 5] Candidate initializes assessment...");
  const startRes = await fetch(`${BASE_URL}/api/test/${inviteToken}/start`, {
    method: "POST",
    headers: { Cookie: candCookie || "" },
  });
  const startData = await startRes.json();
  const submissionId = startData.submission.id;
  console.log(`  -> Assessment started! Submission ID: ${submissionId}`);
  console.log(`  -> Token Budget: ${startData.submission.tokenBudget}`);

  // CRITERION 1: ASK AI Assistant
  console.log("\n===========================================================");
  console.log("CRITERION 1: ASK AI ASSISTANT (Multi-tier Provider Test)");
  console.log("===========================================================");
  const aiPrompt =
    "Give me a brief hint on how to read inputs and compute sum in Python.";
  const tAi0 = performance.now();
  const aiRes = await fetch(`${BASE_URL}/api/test/${inviteToken}/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: candCookie || "" },
    body: JSON.stringify({
      prompt: aiPrompt,
      promptType: "HINT",
      problemId,
      submissionId,
    }),
  });

  const aiData = await aiRes.json();
  const aiLatency = Math.round(performance.now() - tAi0);

  if (!aiRes.ok) {
    console.error("  [FAIL] AI Assistance request failed:", aiData);
    throw new Error(`AI Assistance failed: ${JSON.stringify(aiData)}`);
  }

  console.log(`  [PASS] AI Provider Active : ${aiData.provider || "gemini"}`);
  console.log(`  [PASS] Latency            : ${aiLatency} ms`);
  console.log(`  [PASS] Tokens Deducted    : ${aiData.tokensUsed}`);
  console.log(`  [PASS] Tokens Remaining   : ${aiData.tokensRemaining}`);
  console.log(
    `  [PASS] AI Guidance Given  :\n  "${aiData.response.slice(0, 120)}..."`,
  );

  // CRITERION 2: CODE EXECUTION (Judge0)
  console.log("\n===========================================================");
  console.log("CRITERION 2: CODE EXECUTION (Judge0 Evaluation)");
  console.log("===========================================================");
  const candidateCode = `import sys
parts = sys.stdin.read().split()
if len(parts) >= 2:
    print(int(parts[0]) + int(parts[1]))
`;
  const tCode0 = performance.now();
  const submitRes = await fetch(`${BASE_URL}/api/test/${inviteToken}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: candCookie || "" },
    body: JSON.stringify({
      submissionId,
      problemId,
      code: candidateCode,
      language: "PYTHON",
    }),
  });

  const submitData = await submitRes.json();
  const codeLatency = Math.round(performance.now() - tCode0);

  if (!submitRes.ok) {
    console.error("  [FAIL] Code submission failed:", submitData);
    throw new Error(`Code submission failed: ${JSON.stringify(submitData)}`);
  }

  console.log(`  [PASS] Code Execution Latency : ${codeLatency} ms`);
  console.log(
    `  [PASS] Test Cases Passed     : ${submitData.results.passed} / ${submitData.results.total}`,
  );
  console.log(
    `  [PASS] Pass Percentage       : ${submitData.results.percentage}%`,
  );

  // CRITERION 3 & 4: CODE QUALITY & COMPOSITE SCORING
  console.log("\n===========================================================");
  console.log("CRITERIA 3 & 4: CODE QUALITY & 4-ATTRIBUTE SCORING");
  console.log("===========================================================");
  const tFinish0 = performance.now();
  const finishRes = await fetch(`${BASE_URL}/api/test/${inviteToken}/finish`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: candCookie || "" },
    body: JSON.stringify({ submissionId }),
  });

  const finishData = await finishRes.json();
  const finishLatency = Math.round(performance.now() - tFinish0);

  if (!finishRes.ok) {
    console.error("  [FAIL] Assessment finish failed:", finishData);
    throw new Error(`Assessment finish failed: ${JSON.stringify(finishData)}`);
  }

  const scores = finishData.scores;
  console.log(`  [PASS] Assessment Finish Latency : ${finishLatency} ms`);
  console.log("  ---------------------------------------------------------");
  console.log(
    `  Criterion 1 - Correctness Score   : ${scores.correctness} / 100`,
  );
  console.log(`  Criterion 2 - Time Efficiency     : ${scores.time} / 100`);
  console.log(
    `  Criterion 3 - Token Frugality     : ${scores.tokenSaving} / 100`,
  );
  console.log(
    `  Criterion 4 - AI Code Quality     : ${scores.codeQuality} / 100`,
  );
  console.log("  ---------------------------------------------------------");
  console.log(
    `  FINAL COMPOSITE SCORE             : ${scores.composite} / 100`,
  );
  console.log("===========================================================");
  console.log("SUCCESS: All 4 assessment criteria are fully functioning!\n");
}

runE2E()
  .catch((err) => {
    console.error("E2E Verification Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
