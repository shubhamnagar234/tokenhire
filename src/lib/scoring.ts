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
  /** Optional: AI-assessed code quality score (0–100). When provided, overrides the placeholder formula. */
  codeQualityScore?: number
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
      : 100

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

  // code quality: use AI-assessed score if available, otherwise fall back to
  // a proxy based on correctness + token efficiency
  const scoreCodeQuality =
    input.codeQualityScore !== undefined
      ? Math.max(0, Math.min(100, input.codeQualityScore))
      : scoreCorrectness * 0.8 + scoreTokenSaving * 0.2

  // normalize weights in case they don't exactly equal 1.0
  const totalWeight =
    input.weightCorrectness +
    input.weightTime +
    input.weightTokenSaving +
    input.weightCodeQuality

  const wCorrectness = input.weightCorrectness / totalWeight
  const wTime = input.weightTime / totalWeight
  const wTokenSaving = input.weightTokenSaving / totalWeight
  const wCodeQuality = input.weightCodeQuality / totalWeight

  // composite weighted score
  const scoreComposite =
    scoreCorrectness * wCorrectness +
    scoreTime * wTime +
    scoreTokenSaving * wTokenSaving +
    scoreCodeQuality * wCodeQuality

  return {
    scoreCorrectness: Math.round(scoreCorrectness * 10) / 10,
    scoreTime: Math.round(scoreTime * 10) / 10,
    scoreTokenSaving: Math.round(scoreTokenSaving * 10) / 10,
    scoreCodeQuality: Math.round(scoreCodeQuality * 10) / 10,
    scoreComposite: Math.round(scoreComposite * 10) / 10,
  }
}