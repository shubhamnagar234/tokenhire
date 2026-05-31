interface ScoreInput {
  testCasesPassed: number
  testCasesTotal: number
  timeUsedMins: number
  timeLimitMins: number
  tokensUsed: number
  tokenBudget: number
  weightCorrectness: number
  weightTime: number
  weightTokenSaving: number
  weightCodeQuality: number
}

interface ScoreOutput {
  scoreCorrectness: number
  scoreTime: number
  scoreTokenSaving: number
  scoreCodeQuality: number
  scoreComposite: number
}

export function calculateScore(input: ScoreInput): ScoreOutput {
  // correctness — percentage of test cases passed (0-100)
  const scoreCorrectness =
    input.testCasesTotal > 0
      ? (input.testCasesPassed / input.testCasesTotal) * 100
      : 0

  // time score — more time remaining = higher score (0-100)
  const timeRemaining = input.timeLimitMins - input.timeUsedMins
  const scoreTime = Math.max(
    0,
    (timeRemaining / input.timeLimitMins) * 100
  )

  // token saving — fewer tokens used = higher score (0-100)
  // candidate who uses 0 tokens gets 100, uses all gets 0
  const tokensSaved = input.tokenBudget - input.tokensUsed
  const scoreTokenSaving = Math.max(
    0,
    (tokensSaved / input.tokenBudget) * 100
  )

  // code quality placeholder — can be enhanced with AI review later
  // for now based on correctness with a slight bonus for efficiency
  const scoreCodeQuality = scoreCorrectness * 0.8 + scoreTokenSaving * 0.2

  // composite weighted score
  const scoreComposite =
    scoreCorrectness * input.weightCorrectness +
    scoreTime * input.weightTime +
    scoreTokenSaving * input.weightTokenSaving +
    scoreCodeQuality * input.weightCodeQuality

  return {
    scoreCorrectness: Math.round(scoreCorrectness * 10) / 10,
    scoreTime: Math.round(scoreTime * 10) / 10,
    scoreTokenSaving: Math.round(scoreTokenSaving * 10) / 10,
    scoreCodeQuality: Math.round(scoreCodeQuality * 10) / 10,
    scoreComposite: Math.round(scoreComposite * 10) / 10,
  }
}