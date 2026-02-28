// ==========================================
// SERVICE FOOTBALL - API-Football + Fallback
// ==========================================
// Migré depuis src/services/football.ts (comportement identique)

import { Match } from '@/types'
import { formatDate, formatTime } from './utils'

const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io'
const API_KEY = process.env.API_FOOTBALL_KEY || ''
const FD_API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''
const FD_BASE_URL = 'https://api.football-data.org/v4'

const PRIORITY_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 848, 15]

const PRIORITY_COMPETITION_NAMES = [
  'premier league', 'la liga', 'primera division', 'serie a',
  'bundesliga', 'ligue 1', 'champions league', 'europa league',
  'conference league', 'world cup', 'eredivisie', 'championship',
  'copa libertadores',
]

const TODAY_VALID_STATUSES = [
  'NS', 'TBD', '1H', 'HT', '2H', 'ET', 'P', 'LIVE',
  'FT', 'AET', 'PEN', 'SUSP', 'INT', 'AWD', 'WO',
]
const FUTURE_VALID_STATUSES = ['NS', 'TBD']
const FINISHED_STATUSES = ['FT', 'AET', 'PEN']

interface APIFixture {
  fixture: { id: number; date: string; timestamp: number; status: { short: string } }
  league: { id: number; name: string; country: string; logo: string }
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } }
  goals: { home: number | null; away: number | null }
}

interface FDMatch {
  id: number; utcDate: string; status: string
  homeTeam: { id: number; name: string; crest: string }
  awayTeam: { id: number; name: string; crest: string }
  competition: { id: number; name: string; emblem: string }
  score: { fullTime: { home: number | null; away: number | null }; halfTime: { home: number | null; away: number | null } }
}

function mapFDStatus(fdStatus: string): string {
  switch (fdStatus) {
    case 'SCHEDULED': case 'TIMED': return 'NS'
    case 'IN_PLAY': return 'LIVE'
    case 'PAUSED': return 'HT'
    case 'FINISHED': return 'FT'
    case 'POSTPONED': return 'PST'
    case 'CANCELLED': return 'CANC'
    case 'SUSPENDED': return 'SUSP'
    case 'EXTRA_TIME': return 'ET'
    case 'PENALTY_SHOOTOUT': return 'P'
    default: return 'NS'
  }
}

function isPriorityCompetition(name: string): boolean {
  const lower = name.toLowerCase()
  return PRIORITY_COMPETITION_NAMES.some(p => lower.includes(p))
}

async function getMatchesFromFootballData(dateStr: string, isFutureDate: boolean): Promise<Match[]> {
  if (!FD_API_KEY) return []
  try {
    const nextDay = new Date(dateStr + 'T00:00:00Z')
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    const dateToStr = nextDay.toISOString().split('T')[0]
    const response = await fetch(
      `${FD_BASE_URL}/matches?dateFrom=${dateStr}&dateTo=${dateToStr}`,
      { headers: { 'X-Auth-Token': FD_API_KEY }, next: { revalidate: isFutureDate ? 600 : 300 } }
    )
    if (!response.ok) return []
    const data = await response.json() as { matches: FDMatch[] }
    if (!data.matches || data.matches.length === 0) return []
    const validStatuses = isFutureDate ? FUTURE_VALID_STATUSES : TODAY_VALID_STATUSES
    return data.matches
      .filter(m => m.status !== 'CANCELLED' && m.utcDate.startsWith(dateStr))
      .map((m): Match => {
        const mappedStatus = mapFDStatus(m.status)
        const isFinished = FINISHED_STATUSES.includes(mappedStatus)
        const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'P'].includes(mappedStatus)
        const homeScore = m.score?.fullTime?.home ?? (isLive ? (m.score?.halfTime?.home ?? null) : null)
        const awayScore = m.score?.fullTime?.away ?? (isLive ? (m.score?.halfTime?.away ?? null) : null)
        return {
          id: m.id.toString(),
          sport: 'football',
          homeTeam: m.homeTeam.name,
          awayTeam: m.awayTeam.name,
          homeTeamLogo: m.homeTeam.crest,
          awayTeamLogo: m.awayTeam.crest,
          league: m.competition.name,
          leagueLogo: m.competition.emblem,
          date: m.utcDate.split('T')[0],
          time: formatTime(m.utcDate),
          timestamp: Math.floor(new Date(m.utcDate).getTime() / 1000),
          status: mappedStatus,
          isPriority: isPriorityCompetition(m.competition.name),
          homeScore, awayScore, isFinished,
        }
      })
      .filter(m => validStatuses.includes(m.status!))
      .sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1
        if (!a.isPriority && b.isPriority) return 1
        if (!a.isFinished && b.isFinished) return -1
        if (a.isFinished && !b.isFinished) return 1
        return (a.timestamp || 0) - (b.timestamp || 0)
      })
  } catch { return [] }
}

async function getMatchesFromAPIFootball(dateStr: string, isFutureDate: boolean): Promise<Match[]> {
  if (!API_KEY) return []
  try {
    const response = await fetch(
      `https://${API_HOST}/fixtures?date=${dateStr}`,
      {
        headers: { 'x-apisports-key': API_KEY, 'x-apisports-host': API_HOST },
        next: { revalidate: isFutureDate ? 600 : 300 },
      }
    )
    if (!response.ok) return []
    const data = await response.json() as { response: APIFixture[]; errors: Record<string, string> }
    if (data.errors && Object.keys(data.errors).length > 0) return []
    if (!data.response || data.response.length === 0) return []
    const validStatuses = isFutureDate ? FUTURE_VALID_STATUSES : TODAY_VALID_STATUSES
    return data.response
      .filter((f) => validStatuses.includes(f.fixture.status.short))
      .map((f) => ({
        id: f.fixture.id.toString(),
        sport: 'football' as const,
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeTeamLogo: f.teams.home.logo,
        awayTeamLogo: f.teams.away.logo,
        league: f.league.name,
        leagueLogo: f.league.logo,
        date: f.fixture.date.split('T')[0],
        time: formatTime(f.fixture.date),
        timestamp: f.fixture.timestamp,
        status: f.fixture.status.short,
        isPriority: PRIORITY_LEAGUES.includes(f.league.id),
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        isFinished: FINISHED_STATUSES.includes(f.fixture.status.short),
      }))
      .sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1
        if (!a.isPriority && b.isPriority) return 1
        if (!a.isFinished && b.isFinished) return -1
        if (a.isFinished && !b.isFinished) return 1
        return (a.timestamp || 0) - (b.timestamp || 0)
      })
  } catch { return [] }
}

export async function getMatchesByDate(targetDate?: Date): Promise<Match[]> {
  const dateStr = formatDate(targetDate || new Date())
  const isFutureDate = targetDate ? targetDate > new Date() : false
  let matches = await getMatchesFromAPIFootball(dateStr, isFutureDate)
  if (matches.length === 0) {
    matches = await getMatchesFromFootballData(dateStr, isFutureDate)
  }
  return matches
}

export async function getPriorityMatches(): Promise<Match[]> {
  const all = await getMatchesByDate(new Date())
  return all.filter(m => m.isPriority)
}

export const footballService = { getMatchesByDate, getPriorityMatches }
