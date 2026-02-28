// ==========================================
// SERVICE NFL (American Football)
// ==========================================

import { Match } from '@/types'
import { fetchFromAPISports } from './apiSportsClient'
import { formatDate, formatTime } from './utils'

const HOST = 'v1.nfl.api-sports.io'

const PRIORITY_LEAGUE_IDS = [1] // NFL
const FINISHED_STATUSES = ['FT', 'OT', 'FO']
const VALID_STATUSES = ['NS', 'Q1', 'Q2', 'Q3', 'Q4', 'HT', 'OT', 'FT', 'FO', 'CANC', 'POST']

interface APIGame {
  game: { id: number; date: { date: string; time?: string }; stage: string }
  league: { id: number; name: string; logo?: string; season?: number }
  teams: { home: { id: number; name: string; logo?: string }; away: { id: number; name: string; logo?: string } }
  scores: { home: { total?: number | null }; away: { total?: number | null } }
  status: { short: string; long: string; timer?: string | null }
}

export async function getMatchesByDate(targetDate?: Date): Promise<Match[]> {
  const dateStr = formatDate(targetDate || new Date())
  const isFutureDate = !!targetDate && targetDate > new Date()
  const season = new Date(dateStr).getFullYear()
  const data = await fetchFromAPISports(HOST, `/games?date=${dateStr}&season=${season}`, isFutureDate ? 600 : 300)
  return (data.response as APIGame[])
    .filter(g => VALID_STATUSES.includes(g.status.short))
    .map((g): Match => {
      const fullDate = `${g.game.date.date}T${g.game.date.time ?? '00:00'}:00`
      return {
        id: g.game.id.toString(),
        sport: 'nfl',
        league: `${g.league.name} ${g.league.season ?? ''}`.trim(),
        homeTeam: g.teams.home.name,
        awayTeam: g.teams.away.name,
        homeTeamLogo: g.teams.home.logo,
        awayTeamLogo: g.teams.away.logo,
        leagueLogo: g.league.logo,
        date: g.game.date.date,
        time: g.game.date.time ? formatTime(fullDate) : '?',
        timestamp: Math.floor(new Date(fullDate).getTime() / 1000),
        status: g.status.short,
        isPriority: PRIORITY_LEAGUE_IDS.includes(g.league.id),
        homeScore: g.scores?.home?.total ?? null,
        awayScore: g.scores?.away?.total ?? null,
        isFinished: FINISHED_STATUSES.includes(g.status.short),
      }
    })
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1
      if (!a.isPriority && b.isPriority) return 1
      return (a.timestamp || 0) - (b.timestamp || 0)
    })
}

export async function getPriorityMatches(): Promise<Match[]> {
  return (await getMatchesByDate(new Date())).filter(m => m.isPriority)
}

export const nflService = { getMatchesByDate, getPriorityMatches }
