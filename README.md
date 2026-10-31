# ⚡ TokenHire: AI-Gated Technical Assessments with Token Accounting

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Monaco Editor](<https://img.shields.io/badge/Monaco-Editor%20(VS%20Code)-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white>)](https://microsoft.github.io/monaco-editor/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![LangChain](https://img.shields.io/badge/LangChain-Orchestration-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://www.langchain.com/)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Groq](https://img.shields.io/badge/Groq-LPU%20Inference-F05A28?style=for-the-badge)](https://groq.com/)
[![Judge0](https://img.shields.io/badge/Judge0-Sandboxed%20Execution-4CAF50?style=for-the-badge)](https://judge0.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash-Redis%20Rate%20Limiting-00E599?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **Where AI token efficiency is a first-class hiring signal.**  
> Every candidate receives an identical AI token budget. How strategically they utilize AI assistance—alongside correctness, speed, and code quality—determines their final rank.

TokenHire measures the skill engineering teams actually care about: not _"Can you code without AI in an unrealistic vacuum?"_ but **_"Can you architect, debug, and ship superior code efficiently WITH AI?"_**

---

## 📌 Table of Contents

- [The Core Philosophy](#-the-core-philosophy)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [The 4-Factor Composite Scoring Engine](#-the-4-factor-composite-scoring-engine)
- [Tech Stack](#-tech-stack)
- [Relational Data Model (Prisma ORM)](#-relational-data-model-prisma-orm)
- [Getting Started Locally](#-getting-started-locally)
- [Environment Configuration](#-environment-configuration)
- [Production & Security Architecture](#-production--security-architecture)
- [Contributing & License](#-contributing--license)

---

## 💡 The Core Philosophy

Traditional technical hiring platforms (LeetCode, HackerRank) attempt to treat AI as an adversarial cheating vector:

- Strict tab-monitoring, copy-paste disabled, webcam tracking, and sterile scratchpads.
- **The Reality**: In modern engineering workflows, 90%+ of professional developers use Copilot, Cursor, Gemini, and Claude daily.
- Banning AI tests memorization of syntax rather than software engineering competency.

### The TokenHire Solution: Token Accounting

TokenHire flips the paradigm:

1. **AI is Built-In**: Every candidate has an embedded AI assistant right inside their Monaco editor (powered by a resilient multi-tier fallback pipeline: **Gemini 2.5 Flash**, **Groq Qwen/Llama**, and **OpenRouter**).
2. **Fixed Token Budget**: Every candidate receives a predetermined token pool (e.g., 2,500 tokens).
3. **Strategic Intent**: Candidates can request `HINT`, `EXPLAIN`, `DEBUG`, `OPTIMIZE`, or `GENERATE`. Every query atomically deducts tokens from their budget based on exact usage metadata.
4. **Hiring Signal**: Candidates who craft precise, high-signal prompts preserve their budget and achieve higher scores; candidates who blindly paste code exhaust their tokens early.

---

## 🏛 System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Candidate Assessment Client        │
                                  │   (Next.js 16 + Monaco VS Code Editor)       │
                                  │   - Real-time Token Budget HUD               │
                                  │   - In-Editor AI Prompt Menu                 │
                                  │   - Test Runner & Split Pane Layout          │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                                         │ HTTP / Server API Routes
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │           TokenHire API & Security Layer     │
                                  │  - Upstash Redis Rate Limiting (Fail-Open)   │
                                  │  - Token Invite Authentication (cuid)        │
                                  │  - Atomic Token Deduction Transaction        │
                                  └──────────┬────────────────────────┬──────────┘
                                             │                        │
                    ┌────────────────────────┴────────┐      ┌────────┴────────────────────────┐
                    ▼                                 ▼      ▼                                 ▼
      ┌──────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
      │  AI Multi-Tier Pipeline  │      │  Remote Code Execution   │      │   Database & Analytics   │
      │  - LangChain Core        │      │  - Judge0 Sandbox Engine │      │  - Prisma ORM            │
      │  - 1°: Gemini 2.5 Flash  │      │  - RapidAPI -> Public CE │      │  - PostgreSQL (Neon)     │
      │  - 2°: Groq LPU (Qwen)   │      │  - Multi-language Tests  │      │  - Full Audit Token Logs │
      │  - 3°: OpenRouter API    │      │  - Hidden Test Cases     │      │  - Recruiter Leaderboard │
      │  - Atomic Accounting     │      │    (JS/TS/Python/Java/C) │      │                          │
      └──────────────────────────┘      └──────────────────────────┘      └──────────────────────────┘
```

---

## ✨ Key Features

### For Recruiters & Engineering Hiring Managers

- **📋 Custom Test Studio**: Create customized assessments with configurable time limits, difficulty, token budget allocations, and custom AI models (including **Gemini 2.5 Flash**, **Groq Qwen**, **Groq GPT-OSS**, and **OpenRouter**).
- **⚖️ Dynamic Scoring Weights**: Tailor the composite evaluation formula per role (e.g., weight token efficiency higher for senior roles, correctness higher for juniors).
- **✉️ Automated Candidate Invites**: Send unique, single-use, time-expiring assessment invitation links via **Resend**.
- **📊 Real-Time Interactive Leaderboard**: Instant candidate rankings sorted by composite score, with granular breakdowns of correctness, time taken, and tokens conserved.
- **🔍 Full Candidate Audit Trail**: Inspect every single AI prompt sent by the candidate, the model's response, token cost, and the candidate's final code diff.

### For Candidates

- **💻 Full In-Browser IDE**: Integrated **Monaco Editor** (the engine behind VS Code) with multi-language syntax highlighting, bracket matching, and auto-completion.
- **🤖 Built-in AI Coding Assistant**: Context-aware assistance with 5 prompt modes:
  - `HINT`: Conceptual nudge without revealing the algorithm.
  - `EXPLAIN`: Clarifies problem statement, constraints, or edge cases.
  - `DEBUG`: Analyzes failing test cases and identifies logical bugs.
  - `OPTIMIZE`: Guides the candidate toward optimal time/space complexity ($O(n)$ vs $O(n^2)$).
  - `GENERATE`: Generates boilerplate or utility helpers (high token cost).
- **⚡ Instant Feedback**: Run code against visible test cases with sub-second feedback before final submission.
- **🛡 Anti-Ratelimit HUD**: Live visual indicator of remaining tokens and completion timer.

---

## 🧮 The 4-Factor Composite Scoring Engine

TokenHire implements a balanced mathematical formula (`src/lib/scoring.ts`) to calculate an overall hiring score (0–100):

$$ ext{Score}_{ ext{composite}} = (w_c \cdot S_{ ext{correctness}}) + (w*t \cdot S*{ ext{time}}) + (w*k \cdot S*{ ext{tokens}}) + (w*q \cdot S*{ ext{quality}})$$

```typescript
// Default Weight Distribution
weightCorrectness: 0.5; // 50% - Functional correctness (unit tests passed)
weightTime: 0.2; // 20% - Time efficiency (remaining assessment time)
weightTokenSaving: 0.2; // 20% - AI efficiency (percentage of token budget saved)
weightCodeQuality: 0.1; // 10% - Code cleanliness, structure & complexity
```

### Why Token Saving Matters:

A candidate who finishes in 20 minutes with 100% test cases passed using **300 tokens** ranks significantly higher than a candidate who passed with **2,400 tokens**. The former demonstrates clear problem decomposition and targeted prompting; the latter reveals trial-and-error dependency.

---

## 🛠 Tech Stack

| Domain                    | Technology / Library                                                                                                     | Purpose                                                                      |
| :------------------------ | :----------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **Full-Stack Framework**  | [Next.js 16](https://nextjs.org/)                                                                                        | React 19 App Router (Turbopack), API route handlers & Server Components      |
| **Language**              | [TypeScript](https://www.typescriptlang.org/)                                                                            | End-to-end static typing across database schemas, APIs, and UI               |
| **Code Editor**           | [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)                                                     | Full VS Code browser editing experience with language services               |
| **AI Orchestration**      | [LangChain](https://www.langchain.com/)                                                                                  | Unified abstraction for prompt templates and multi-tier model cascading      |
| **AI Models**             | [Google Gemini](https://ai.google.dev/), [Groq LPU](https://groq.com/), [OpenRouter](https://openrouter.ai/)             | Ultra-low latency reasoning via Gemini 2.5 Flash, Groq Qwen, and OpenRouter  |
| **Code Execution Engine** | [Judge0 API](https://judge0.com/)                                                                                        | Sandboxed compiler & test runner with automatic failover to Judge0 Public CE |
| **Database & ORM**        | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)                                          | Type-safe relational database management with migrations                     |
| **State & Query Cache**   | [TanStack React Query v5](https://tanstack.com/query), [Zustand](https://zustand.docs.pmnd.rs/)                          | Asynchronous server-state synchronization & global client state              |
| **Rate Limiting**         | [Upstash Redis](https://upstash.com/), [@upstash/ratelimit](https://github.com/upstash/ratelimit)                        | Distributed sliding-window rate limiting on assessment routes                |
| **Authentication**        | [Jose](https://github.com/panva/jose), [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)                                  | Secure stateless JWT sessions & salted password hashing                      |
| **Email Delivery**        | [Resend](https://resend.com/)                                                                                            | Transactional emails and candidate assessment invitations                    |
| **Styling & Motion**      | [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://motion.dev/), [Radix UI](https://www.radix-ui.com/) | Fluid modern dark UI, aurora backgrounds, tilt cards, and dock navigation    |

---

## 🗄 Relational Data Model (Prisma ORM)

The relational schema (`prisma/schema.prisma`) coordinates the assessment ecosystem:

```
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │ Company  │ 1──────* │   User   │ 1──────* │ Problem  │
  └────┬─────┘          └────┬─────┘          └────┬─────┘
       │ 1                   │ 1                   │ 1
       │                     │                     │
       ▼ *                   ▼ *                   ▼ *
  ┌──────────┐          ┌──────────┐          ┌──────────┐
  │   Test   │ 1──────* │TestInvite│ 1──────1 │Submission│
  └──────────┘          └──────────┘          └────┬─────┘
                                                   │ 1
                                                   ▼ *
                                              ┌──────────┐
                                              │ TokenLog │
                                              └──────────┘
```

### Key Models:

- **`Test`**: Defines assessment configuration, duration, scoring weights, and designated `aiModel` (defaults to `gemini-2.5-flash`).
- **`TestInvite`**: Unique cryptographic token (`cuid`) granting candidate access with expiration timestamps.
- **`Submission`**: Captures time taken, total tokens used, sub-scores, and composite rating.
- **`TokenLog`**: Records each prompt type (`HINT`, `EXPLAIN`, `DEBUG`, `OPTIMIZE`, `GENERATE`), user prompt, AI response, and exact tokens deducted.

---

## 🚀 Getting Started Locally

### 1. Prerequisites

- **Node.js** (v18.18+ or v20+)
- **PostgreSQL** database (Local or Cloud via Neon / Supabase)
- **Upstash Redis** account (free tier)
- **Judge0 API Key** (RapidAPI)
- **Gemini / OpenRouter API Key**

### 2. Clone the Repository

```bash
git clone https://github.com/shubhamnagar234/tokenhire.git
cd tokenhire
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Populate the required credentials in `.env`:

```ini
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://username:password@localhost:5432/tokenhire?schema=public"
JWT_SECRET="your_secure_jwt_random_secret"

# AI Provider Keys
GEMINI_API_KEY="your_google_gemini_api_key"
GROQ_API_KEY="your_groq_api_key"
OPENROUTER_API_KEY="your_openrouter_api_key"

# Judge0 Remote Code Execution Engine
JUDGE0_API_URL="https://judge0-ce.p.rapidapi.com"
JUDGE0_API_KEY="your_rapidapi_judge0_key"

# Upstash Redis Rate Limiting
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"

# Transactional Emails
RESEND_API_KEY="your_resend_api_key"
```

### 5. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 6. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the platform.

### 7. Run Complete E2E Verification Benchmark

```bash
npm run test:e2e
```

Runs an automated end-to-end simulation across recruiter test creation, candidate invite generation, AI hint prompting with token deduction, Judge0 code execution, and 4-factor composite scoring.

---

## 🛡 Production & Security Architecture

1. **Atomic Token Deductions**: Token deductions and prompt logs are executed within an atomic `prisma.$transaction()` block, preventing race conditions or double-spending AI budgets.
2. **Budget Enforcement**: When a candidate reaches zero tokens, the backend responds with `402 Token budget exhausted`, locking further AI interactions while keeping the code editor active.
3. **Single-Use Invite Tokens**: Candidate assessments are accessed through one-time tokens with strict expiration timestamps and IP binding.
4. **Sandboxed Code Execution**: All candidate code is compiled and executed remotely inside Judge0 sandboxed Linux containers with strict CPU time and memory limits.

---

## 🤝 Contributing & License

Contributions, feedback, and suggestions are welcome! Feel free to open an issue or submit a pull request.

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

---

<p align="center">
  Crafted with ❤️ by <b>Shubham Nagar</b>
</p>
