// ==========================================
// SERVICE FORMULE 1
// ==========================================
// F1 : API par saison/round, pas par date.
// On récupère le calendrier de la saison courante et on filtre la prochaine course.

import { Match } from '@/types'
import { fetchFromAPISports } from './apiSportsClient'
import { formatDate } from './utils'

const HOST = 'v1.formula-1.api-sports.io'

interface APIRace {
  id: number
  competition: { id: number; name: string; location: { country: string; city: string } }
  circuit: { id: number; name: string; image?: string }
  season: number
  round: number
  date: string
  time?: string
  timestamp: number
  timezone: string
  laps?: { fastest?: { time?: string } }
  weather?: string
  status: string
  type: string
}

function raceToMatch(race: APIRace): Match {
  const dateStr = race.date?.split('T')[0] ?? ''
  return {
    id: race.id.toString(),
    sport: 'f1',
    league: `F1 ${race.season} — Manche ${race.round}`,
    // homeTeam = circuit, awayTeam = pays
    homeTeam: race.circuit?.name ?? 'Circuit',
    awayTeam: race.competition?.location?.city ?? race.competition?.name ?? 'GP',
    homeTeamLogo: race.circuit?.image,
    awayTeamLogo: undefined,
    leagueLogo: undefined,
    date: dateStr,
    time: race.time ?? '?',
    timestamp: race.timestamp,
    status: race.status === 'Completed' ? 'FT' : 'NS',
    isPriority: true,
    homeScore: null,
    awayScore: null,
    isFinished: race.status === 'Completed',
    stade: race.circuit?.name,
  }
}

export async function getMatchesByDate(targetDate?: Date): Promise<Match[]> {
  const dateStr = formatDate(targetDate || new Date())
  const currentSeason = new Date(dateStr).getFullYear()
  const data = await fetchFromAPISports(
    HOST,
    `/races?season=${currentSeason}&type=Race`,
    600
  )
  const races = (data.response as APIRace[])
    .filter(r => r.type === 'Race' || !r.type)
    .sort((a, b) => a.timestamp - b.timestamp)

  // Retourner la course dont la date est la plus proche de la date demandée
  // (même logique que "matchs du jour" : on prend les courses du mois entourant la date)
  const targetTs = new Date(dateStr).getTime() / 1000
  const windowDays = 7 * 24 * 3600 // ±7 jours
  const nearby = races.filter(r => Math.abs(r.timestamp - targetTs) < windowDays)

  if (nearby.length > 0) return nearby.map(raceToMatch)

  // Sinon, retourner la prochaine course à venir
  const upcoming = races.find(r => r.timestamp > targetTs)
  if (upcoming) return [raceToMatch(upcoming)]

  return []
}

export async function getPriorityMatches(): Promise<Match[]> {
  return getMatchesByDate(new Date())
}

export const f1Service = { getMatchesByDate, getPriorityMatches }
