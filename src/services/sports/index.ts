// ==========================================
// DISPATCHER MULTI-SPORT
// ==========================================

import { Match } from '@/types'
import { SportId } from '@/lib/config/sports'

export interface SportService {
  getMatchesByDate(targetDate?: Date): Promise<Match[]>
  getPriorityMatches(): Promise<Match[]>
}

export async function getServiceForSport(sport: SportId): Promise<SportService> {
  switch (sport) {
    case 'football':
      return (await import('./football')).footballService
    case 'basketball':
      return (await import('./basketball')).basketballService
    case 'nba':
      return (await import('./basketball')).nbaService
    case 'baseball':
      return (await import('./baseball')).baseballService
    case 'hockey':
      return (await import('./hockey')).hockeyService
    case 'rugby':
      return (await import('./rugby')).rugbyService
    case 'afl':
      return (await import('./afl')).aflService
    case 'handball':
      return (await import('./handball')).handballService
    case 'volleyball':
      return (await import('./volleyball')).volleyballService
    case 'mma':
      return (await import('./mma')).mmaService
    case 'f1':
      return (await import('./f1')).f1Service
    case 'nfl':
      return (await import('./nfl')).nflService
    default:
      return (await import('./football')).footballService
  }
}
