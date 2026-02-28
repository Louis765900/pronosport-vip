// ==========================================
// SERVICE BASKETBALL (+ NBA)
// ==========================================

import { Match } from '@/types'
import { fetchFromAPISports } from './apiSportsClient'
import { formatDate, formatTime } from './utils'

const HOST = 'v1.basketball.api-sports.io'

// IDs de ligues prioritaires (basketball API-Sports)
const PRIORITY_LEAGUE_IDS = [12, 1, 5] // NBA=12, EuroLeague=1, ACB=5
// ID de la NBA pour le service NBA dédié
const NBA_LEAGUE_ID = 12

const FINISHED_STATUSES = ['FT', 'AOT'] // Full Time, After Overtime
const VALID_STATUSES = ['NS', 'Q1', 'Q2', 'Q3', 'Q4', 'OT', 'HT', 'FT', 'AOT', 'BT', 'CANC']

interface APIGame {
  id: number
  date: string
  time?: string
  timestamp: number
  league: { id: number; name: string; logo: string }
  country: { name: string }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  scores: {
    home: { quarter_1?: number | null; quarter_2?: number | null; quarter_3?: number | null; quarter_4?: number | null; over_time?: number | null; total?: number | null }
    away: { quarter_1?: number | null; quarter_2?: number | null; quarter_3?: number | null; quarter_4?: number | null; over_time?: number | null; total?: number | null }
  }
  status: { short: string; long: string; timer?: string | null }
}

function normalizeGame(game: APIGame, sportId: 'basketball' | 'nba'): Match {
  const isFinished = FINISHED_STATUSES.includes(game.status.short)
  return {
    id: game.id.toString(),
    sport: sportId,
    league: game.league.name,
    homeTeam: game.teams.home.name,
    awayTeam: game.teams.away.name,
    homeTeamLogo: game.teams.home.logo,
    awayTeamLogo: game.teams.away.logo,
    leagueLogo: game.league.logo,
    date: game.date?.split('T')[0] ?? '',
    time: game.time ? formatTime(`${game.date?.split('T')[0]}T${game.time}:00`) : '?',
    timestamp: game.timestamp,
    status: game.status.short,
    isPriority: PRIORITY_LEAGUE_IDS.includes(game.league.id),
    homeScore: game.scores?.home?.total ?? null,
    awayScore: game.scores?.away?.total ?? null,
    isFinished,
  }
}

async function fetchGames(dateStr: string, isFutureDate: boolean, leagueFilter?: number): Promise<Match[]> {
  const path = leagueFilter
    ? `/games?date=${dateStr}&league=${leagueFilter}`
    : `/games?date=${dateStr}`
  const data = await fetchFromAPISports(HOST, path, isFutureDate ? 600 : 300)
  const games = data.response as APIGame[]
  const sportId: 'basketball' | 'nba' = leagueFilter === NBA_LEAGUE_ID ? 'nba' : 'basketball'
  return games
    .filter(g => VALID_STATUSES.includes(g.status.short))
    .map(g => normalizeGame(g, sportId))
    .sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1
      if (!a.isPriority && b.isPriority) return 1
      return (a.timestamp || 0) - (b.timestamp || 0)
    })
}

export async function getMatchesByDate(targetDate?: Date): Promise<Match[]> {
  return fetchGames(formatDate(targetDate || new Date()), !!targetDate && targetDate > new Date())
}

export async function getPriorityMatches(): Promise<Match[]> {
  const all = await getMatchesByDate(new Date())
  return all.filter(m => m.isPriority)
}

export const basketballService = { getMatchesByDate, getPriorityMatches }

// Service NBA dédié (filtre sur league=12)
export async function getNBAMatchesByDate(targetDate?: Date): Promise<Match[]> {
  return fetchGames(
    formatDate(targetDate || new Date()),
    !!targetDate && targetDate > new Date(),
    NBA_LEAGUE_ID
  )
}

export const nbaService = {
  getMatchesByDate: getNBAMatchesByDate,
  getPriorityMatches: async () => getNBAMatchesByDate(new Date()),
}
