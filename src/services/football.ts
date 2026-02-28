import { Match } from '@/types'

// ==========================================
// API-Football (primary)
// ==========================================
const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io'
const API_KEY = process.env.API_FOOTBALL_KEY || ''

// ==========================================
// Football-Data.org (fallback)
// ==========================================
const FD_API_KEY = process.env.FOOTBALL_DATA_API_KEY || ''
const FD_BASE_URL = 'https://api.football-data.org/v4'

// Leagues prioritaires (IDs API-Football)
const PRIORITY_LEAGUES = [
  39,   // Premier League
  140,  // La Liga
  135,  // Serie A
  78,   // Bundesliga
  61,   // Ligue 1
  2,    // Champions League
  3,    // Europa League
  848,  // Conference League
  15,   // FIFA World Cup
]

// Noms de compétitions prioritaires (pour football-data.org)
const PRIORITY_COMPETITION_NAMES = [
  'premier league', 'la liga', 'primera division', 'serie a',
  'bundesliga', 'ligue 1', 'champions league', 'europa league',
  'conference league', 'world cup', 'eredivisie', 'championship',
  'copa libertadores',
]

// Statuts valides pour les matchs du jour (inclut les matchs terminés)
const TODAY_VALID_STATUSES = [
  'NS', 'TBD',                          // Pas encore commencé
  '1H', 'HT', '2H', 'ET', 'P', 'LIVE', // En cours
  'FT', 'AET', 'PEN',                   // Terminés
  'SUSP', 'INT', 'AWD', 'WO',           // Interrompus / attribués
]

// Statuts valides pour les matchs futurs
const FUTURE_VALID_STATUSES = ['NS', 'TBD']

// Statuts indiquant qu'un match est terminé
const FINISHED_STATUSES = ['FT', 'AET', 'PEN']

// ==========================================
// Types API-Football
// ==========================================
interface APIFixture {
  fixture: {
    id: number
    date: string
    timestamp: number
    status: {
      short: string
      long: string
    }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
  }
  teams: {
    home: {
      id: number
      name: string
      logo: string
    }
    away: {
      id: number
      name: string
      logo: string
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

interface APIResponse {
  response: APIFixture[]
  errors: Record<string, string>
  results: number
}

// ==========================================
// Types Football-Data.org
// ==========================================
interface FDMatch {
  id: number
  utcDate: string
  status: string // SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, POSTPONED, CANCELLED, SUSPENDED
  homeTeam: {
    id: number
    name: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    crest: string
  }
  competition: {
    id: number
    name: string
    emblem: string
  }
  score: {
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

interface FDResponse {
  matches: FDMatch[]
  resultSet: { count: number }
}

// ==========================================
// Helpers
// ==========================================
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  })
}

// Convertir le statut football-data.org vers le format interne
function mapFDStatus(fdStatus: string): string {
  switch (fdStatus) {
    case 'SCHEDULED':
    case 'TIMED':
      return 'NS'
    case 'IN_PLAY':
      return 'LIVE'
    case 'PAUSED':
      return 'HT'
    case 'FINISHED':
      return 'FT'
    case 'POSTPONED':
      return 'PST'
    case 'CANCELLED':
      return 'CANC'
    case 'SUSPENDED':
      return 'SUSP'
    case 'EXTRA_TIME':
      return 'ET'
    case 'PENALTY_SHOOTOUT':
      return 'P'
    default:
      return 'NS'
  }
}

function isPriorityCompetition(name: string): boolean {
  const lower = name.toLowerCase()
  return PRIORITY_COMPETITION_NAMES.some(p => lower.includes(p))
}

// ==========================================
// Football-Data.org (fallback source)
// ==========================================
async function getMatchesFromFootballData(dateStr: string, isFutureDate: boolean): Promise<Match[]> {
  if (!FD_API_KEY) {
    console.error('[Football-Data] FOOTBALL_DATA_API_KEY is not configured')
    return []
  }

  try {
    // football-data.org requiert dateTo > dateFrom, donc on ajoute 1 jour
    const nextDay = new Date(dateStr + 'T00:00:00Z')
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    const dateToStr = nextDay.toISOString().split('T')[0]

    console.log(`[Football-Data] Fetching matches for ${dateStr} to ${dateToStr}`)

    const response = await fetch(
      `${FD_BASE_URL}/matches?dateFrom=${dateStr}&dateTo=${dateToStr}`,
      {
        headers: { 'X-Auth-Token': FD_API_KEY },
        next: { revalidate: isFutureDate ? 600 : 300 }
      }
    )

    if (!response.ok) {
      console.error(`[Football-Data] API Error: ${response.status} ${response.statusText}`)
      return []
    }

    const data: FDResponse = await response.json()
    console.log(`[Football-Data] ${data.matches?.length || 0} matchs bruts reçus`)

    if (!data.matches || data.matches.length === 0) {
      return []
    }

    const validStatuses = isFutureDate ? FUTURE_VALID_STATUSES : TODAY_VALID_STATUSES

    const matches: Match[] = data.matches
      .filter(m => m.status !== 'CANCELLED' && m.utcDate.startsWith(dateStr))
      .map((m): Match => {
        const mappedStatus = mapFDStatus(m.status)
        const isFinished = FINISHED_STATUSES.includes(mappedStatus)
        const isLive = ['LIVE', '1H', 'HT', '2H', 'ET', 'P'].includes(mappedStatus)

        // Score: utiliser le score actuel (live ou final)
        const homeScore = m.score?.fullTime?.home ?? (isLive ? (m.score?.halfTime?.home ?? null) : null)
        const awayScore = m.score?.fullTime?.away ?? (isLive ? (m.score?.halfTime?.away ?? null) : null)

        return {
          id: m.id.toString(),
          sport: 'football' as const,
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
          homeScore,
          awayScore,
          isFinished,
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

    console.log(`[Football-Data] ${matches.length} matchs après filtrage`)
    return matches
  } catch (error) {
    console.error('[Football-Data] Error:', error)
    return []
  }
}

// ==========================================
// API-Football (primary source)
// ==========================================
async function getMatchesFromAPIFootball(dateStr: string, isFutureDate: boolean): Promise<Match[]> {
  if (!API_KEY) {
    console.log('[API-Football] API_FOOTBALL_KEY not configured, skipping')
    return []
  }

  try {
    const response = await fetch(
      `https://${API_HOST}/fixtures?date=${dateStr}`,
      {
        method: 'GET',
        headers: {
          'x-apisports-key': API_KEY,
          'x-apisports-host': API_HOST,
        },
        next: { revalidate: isFutureDate ? 600 : 300 }
      }
    )

    if (!response.ok) {
      console.error(`[API-Football] API Error: ${response.status} ${response.statusText}`)
      return []
    }

    const data: APIResponse = await response.json()

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('[API-Football] API Errors:', data.errors)
      return [] // Retourne vide pour déclencher le fallback
    }

    if (!data.response || data.response.length === 0) {
      return []
    }

    const validStatuses = isFutureDate ? FUTURE_VALID_STATUSES : TODAY_VALID_STATUSES

    const matches: Match[] = data.response
      .filter((fixture) => validStatuses.includes(fixture.fixture.status.short))
      .map((fixture) => ({
        id: fixture.fixture.id.toString(),
        sport: 'football' as const,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeTeamLogo: fixture.teams.home.logo,
        awayTeamLogo: fixture.teams.away.logo,
        league: fixture.league.name,
        leagueLogo: fixture.league.logo,
        date: fixture.fixture.date.split('T')[0],
        time: formatTime(fixture.fixture.date),
        timestamp: fixture.fixture.timestamp,
        status: fixture.fixture.status.short,
        isPriority: PRIORITY_LEAGUES.includes(fixture.league.id),
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        isFinished: FINISHED_STATUSES.includes(fixture.fixture.status.short),
      }))
      .sort((a, b) => {
        if (a.isPriority && !b.isPriority) return -1
        if (!a.isPriority && b.isPriority) return 1
        if (!a.isFinished && b.isFinished) return -1
        if (a.isFinished && !b.isFinished) return 1
        return (a.timestamp || 0) - (b.timestamp || 0)
      })

    return matches
  } catch (error) {
    console.error('[API-Football] Error:', error)
    return []
  }
}

// ==========================================
// API publique (avec fallback automatique)
// ==========================================

/**
 * Recupere les matchs pour une date donnee
 * Essaie API-Football en premier, puis football-data.org en fallback
 */
export async function getMatchesByDate(targetDate?: Date): Promise<Match[]> {
  const dateStr = formatDate(targetDate || new Date())
  const isFutureDate = targetDate ? targetDate > new Date() : false

  // Essayer API-Football d'abord
  let matches = await getMatchesFromAPIFootball(dateStr, isFutureDate)

  // Fallback vers football-data.org si API-Football retourne rien
  if (matches.length === 0) {
    console.log('[Football] API-Football vide ou erreur, fallback vers football-data.org')
    matches = await getMatchesFromFootballData(dateStr, isFutureDate)
  }

  return matches
}

// Alias pour compatibilite
export async function getTodayMatches(): Promise<Match[]> {
  return getMatchesByDate(new Date())
}

export async function getMatchesByLeague(leagueId: number): Promise<Match[]> {
  // Pour la recherche par ligue, on utilise getMatchesByDate et on filtre
  const allMatches = await getMatchesByDate(new Date())
  // Pas de mapping ligue ID -> nom pour l'instant, retourne tous les matchs
  return allMatches
}

export async function getPriorityMatches(): Promise<Match[]> {
  const allMatches = await getMatchesByDate(new Date())
  return allMatches.filter(m => m.isPriority)
}
