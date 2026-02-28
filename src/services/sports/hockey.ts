// ==========================================
// SERVICE HOCKEY (sur glace)
// ==========================================

import { Match } from '@/types'
import { fetchFromAPISports } from './apiSportsClient'
import { formatDate, formatTime } from './utils'

const HOST = 'v1.hockey.api-sports.io'

const PRIORITY_LEAGUE_IDS = [57, 1] // NHL=57, KHL=1
const FINISHED_STATUSES = ['FT', 'AOT', 'PEN']
const VALID_STATUSES = ['NS', 'P1', 'P2', 'P3', 'OT', 'BT', 'FT', 'AOT', 'PEN', 'CANC']

interface APIGame {
  id: number; date: string; time?: string; timestamp: number
  league: { id: number; name: string; logo: string }
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } }
  scores: { home: number | null; away: number | null }
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
      sport: 'hockey',
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
      homeScore: g.scores?.home ?? null,
      awayScore: g.scores?.away ?? null,
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

export const hockeyService = { getMatchesByDate, getPriorityMatches }
