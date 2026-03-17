import Sentiment from 'sentiment'

const engine = new Sentiment()

export interface SentimentResult {
  score: number        // normalized −1.0 to 1.0 via Math.tanh
  comparative: number  // raw comparative (score / wordCount)
}

export function analyzeSentiment(note: string): SentimentResult | null {
  const trimmed = note.trim()
  if (!trimmed) return null

  try {
    const result = engine.analyze(trimmed)
    // Normalize via tanh so large scores are bounded to [-1, 1]
    const normalized = Math.tanh(result.comparative)
    return {
      score: normalized,
      comparative: result.comparative,
    }
  } catch {
    return null
  }
}
