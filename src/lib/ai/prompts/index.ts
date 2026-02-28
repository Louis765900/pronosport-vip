// ==========================================
// DISPATCHER PROMPTS SPORT-AWARE
// ==========================================

import { Match } from '@/types'
import { footballPerplexityPrompt, footballGeminiPrompt } from './football'
import { basketballPerplexityPrompt, basketballGeminiPrompt } from './basketball'
import { f1PerplexityPrompt, f1GeminiPrompt } from './f1'
import { mmaPerplexityPrompt, mmaGeminiPrompt } from './mma'
import { rugbyPerplexityPrompt, rugbyGeminiPrompt } from './rugby'
import { handballPerplexityPrompt, handballGeminiPrompt } from './handball'
import { volleyballPerplexityPrompt, volleyballGeminiPrompt } from './volleyball'
import { hockeyPerplexityPrompt, hockeyGeminiPrompt } from './hockey'
import { baseballPerplexityPrompt, baseballGeminiPrompt } from './baseball'
import { nflPerplexityPrompt, nflGeminiPrompt } from './nfl'
import { aflPerplexityPrompt, aflGeminiPrompt } from './afl'

export function getPerplexityDataPrompt(match: Match): string {
  switch (match.sport) {
    case 'basketball':
    case 'nba':
      return basketballPerplexityPrompt(match)
    case 'f1':
      return f1PerplexityPrompt(match)
    case 'mma':
      return mmaPerplexityPrompt(match)
    case 'rugby':
      return rugbyPerplexityPrompt(match)
    case 'handball':
      return handballPerplexityPrompt(match)
    case 'volleyball':
      return volleyballPerplexityPrompt(match)
    case 'hockey':
      return hockeyPerplexityPrompt(match)
    case 'baseball':
      return baseballPerplexityPrompt(match)
    case 'nfl':
      return nflPerplexityPrompt(match)
    case 'afl':
      return aflPerplexityPrompt(match)
    case 'football':
    default:
      return footballPerplexityPrompt(match)
  }
}

export function getGeminiReasoningPrompt(match: Match, rawData: string): string {
  switch (match.sport) {
    case 'basketball':
    case 'nba':
      return basketballGeminiPrompt(match, rawData)
    case 'f1':
      return f1GeminiPrompt(match, rawData)
    case 'mma':
      return mmaGeminiPrompt(match, rawData)
    case 'rugby':
      return rugbyGeminiPrompt(match, rawData)
    case 'handball':
      return handballGeminiPrompt(match, rawData)
    case 'volleyball':
      return volleyballGeminiPrompt(match, rawData)
    case 'hockey':
      return hockeyGeminiPrompt(match, rawData)
    case 'baseball':
      return baseballGeminiPrompt(match, rawData)
    case 'nfl':
      return nflGeminiPrompt(match, rawData)
    case 'afl':
      return aflGeminiPrompt(match, rawData)
    case 'football':
    default:
      return footballGeminiPrompt(match, rawData)
  }
}
