// ==========================================
// SERVICE MMA (Mixed Martial Arts)
// ==========================================
// Un event MMA = plusieurs combats → un Match par combat

import { Match } from '@/types'
import { fetchFromAPISports } from './apiSportsClient'
import { formatDate, formatTime } from './utils'

const HOST = 'v1.mma.api-sports.io'

const PRIORITY_LEAGUE_IDS = [1] // UFC
const FINISHED_STATUSES = ['FT']
const VALID_STATUSES = ['NS', 'LIVE', 'FT', 'CANC', 'POST']

interface APIFight {
  id: number
  date: string
  time?: string
  timestamp: number
  event: { id: number; name: string; logo?: string }
  league: { id: number; name: string; logo?: string }
  fighters: {
    first: { id: number; name: string; logo?: string }
    second: { id: number; name: string; logo?: string }
  }
  winner?: { id: number; name: string } | null
  rounds?: number | null
  status: { short: string; long: string }
}

export async function getMatchesByDate(targetDate?: Date): Promise<Match[]> {
  const dateStr = formatDate(targetDate || new Date())
  const isFutureDate = !!targetDate && targetDate > new Date()
  const data = await fetchFromAPISports(HOST, `/fights?date=${dateStr}`, isFutureDate ? 600 : 300)
  return (data.response as APIFight[])
    .filter(f => VALID_STATUSES.includes(f.status.short))
    .map((f): Match => ({
      id: f.id.toString(),
      sport: 'mma',
      // Le nom de l'event est utilisé comme "ligue"
      league: f.event?.name ?? f.league?.name ?? 'MMA',
      // Les deux combattants sont homeTeam / awayTeam
      homeTeam: f.fighters?.first?.name ?? 'Fighter 1',
      awayTeam: f.fighters?.second?.name ?? 'Fighter 2',
      homeTeamLogo: f.fighters?.first?.logo,
      awayTeamLogo: f.fighters?.second?.logo,
      leagueLogo: f.league?.logo,
      date: f.date?.split('T')[0] ?? '',
      time: f.time ? formatTime(`${f.date?.split('T')[0]}T${f.time}:00`) : '?',
      timestamp: f.timestamp,
      status: f.status.short,
      isPriority: PRIORITY_LEAGUE_IDS.includes(f.league?.id),
      homeScore: null,
      awayScore: null,
      isFinished: FINISHED_STATUSES.includes(f.status.short),
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

export const mmaService = { getMatchesByDate, getPriorityMatches }
