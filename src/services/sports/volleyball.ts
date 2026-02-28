// ==========================================
// SERVICE VOLLEYBALL
// ==========================================

import { Match } from '@/types'
import { fetchFromAPISports } from './apiSportsClient'
import { formatDate, formatTime } from './utils'

const HOST = 'v1.volleyball.api-sports.io'

const PRIORITY_LEAGUE_IDS = [1] // Champions League
const FINISHED_STATUSES = ['FT']
const VALID_STATUSES = ['NS', 'S1', 'S2', 'S3', 'S4', 'S5', 'FT', 'CANC', 'POST']

interface APIGame {
  id: number; date: string; time?: string; timestamp: number
  league: { id: number; name: string; logo: string }
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } }
  scores: { home: { sets?: number | null; total?: number | null }; away: { sets?: number | null; total?: number | null } }
  status: { short: string; long: string }
}

export async function getMatchesByDate(targetDate?: Date): Promise<Match[]> {
  const dateStr = formatDate(targetDate || new Date())
  const isFutureDate = !!targetDate && targetDate > new Date()
  const data = await fetchFromAPISports(HOST, `/games?date=${dateStr}`, isFutureDate ? 600 : 300)
  return (data.response as APIGame[])
    .filter(g => VALID_STATUSES.includes(g.status.short))
    .map((g): Match => ({
      id: g.id.toString(),
      sport: 'volleyball',
      league: g.league.name,
      homeTeam: g.teams.home.name,
      awayTeam: g.teams.away.name,
      homeTeamLogo: g.teams.home.logo,
      awayTeamLogo: g.teams.away.logo,
      leagueLogo: g.league.logo,
      date: g.date?.split('T')[0] ?? '',
      time: g.time ? formatTime(`${g.date?.split('T')[0]}T${g.time}:00`) : '?',
      timestamp: g.timestamp,
      status: g.status.short,
      isPriority: PRIORITY_LEAGUE_IDS.includes(g.league.id),
      // En volley : les "scores" sont des sets remportés
      homeScore: g.scores?.home?.sets ?? null,
      awayScore: g.scores?.away?.sets ?? null,
      isFinished: FINISHED_STATUSES.includes(g.status.short),
    }))
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1
      if (!a.isPriority && b.isPriority) return 1
      return (a.timestamp || 0) - (b.timestamp || 0)
    })
}

export async function getPriorityMatches(): Promise<Match[]> {
  return (await getMatchesByDate(new Date())).filter(m => m.isPriority)
}

export const volleyballService = { getMatchesByDate, getPriorityMatches }
