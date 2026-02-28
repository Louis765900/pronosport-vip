import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { Match, LeagueGroup, DateFilter } from '@/types'
import { SportId, DEFAULT_SPORT } from '@/lib/config/sports'
import { getServiceForSport } from '@/services/sports'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || '',
})

// Ordre de priorité des ligues pour le tri
const LEAGUE_PRIORITY: string[] = [
  'Champions League',
  'UEFA Champions League',
  'Europa League',
  'UEFA Europa League',
  'Conference League',
  'Ligue 1',
  'Premier League',
  'La Liga',
  'Primera Division',
  'Serie A',
  'Bundesliga',
  'Eredivisie',
  'Championship',
  'Copa Libertadores',
]

/**
 * Formate la date courte pour l'affichage
 */
function formatDateShort(filter: DateFilter): string {
  const today = new Date()

  let targetDate: Date
  switch (filter) {
    case 'tomorrow':
      targetDate = new Date(today)
      targetDate.setDate(today.getDate() + 1)
      break
    case 'day-after':
      targetDate = new Date(today)
      targetDate.setDate(today.getDate() + 2)
      break
    case 'today':
    default:
      targetDate = today
  }

  return targetDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Groupe les matchs par ligue
 */
function groupMatchesByLeague(matches: Match[]): LeagueGroup[] {
  const grouped: Record<string, Match[]> = {}

  for (const match of matches) {
    if (!grouped[match.league]) {
      grouped[match.league] = []
    }
    grouped[match.league].push(match)
  }

  // Convertir en tableau et trier par priorité
  const leagueGroups: LeagueGroup[] = Object.entries(grouped).map(([league, matches]) => ({
    league,
    matches: matches.sort((a, b) => {
      // Trier par timestamp si disponible, sinon par time string
      if (a.timestamp && b.timestamp) {
        return a.timestamp - b.timestamp
      }
      return a.time.localeCompare(b.time)
    }),
  }))

  // Trier les ligues par priorité
  leagueGroups.sort((a, b) => {
    const aIndex = LEAGUE_PRIORITY.findIndex(l => a.league.includes(l))
    const bIndex = LEAGUE_PRIORITY.findIndex(l => b.league.includes(l))

    if (aIndex !== -1 && bIndex === -1) return -1
    if (aIndex === -1 && bIndex !== -1) return 1
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex

    return a.league.localeCompare(b.league)
  })

  return leagueGroups
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = (searchParams.get('date') || 'today') as DateFilter
    const sport = (searchParams.get('sport') || DEFAULT_SPORT) as SportId
    const priorityOnly = searchParams.get('priority') === 'true'

    const shortDate = formatDateShort(dateFilter)

    // ── Cache Redis (5 min today / 30 min future) ──────────────
    const cacheKey = `matches:${sport}:${dateFilter}${priorityOnly ? ':priority' : ''}`
    const cacheTTL = dateFilter === 'today' ? 300 : 1800
    try {
      const cached = await redis.get<{ leagues: LeagueGroup[]; total: number }>(cacheKey)
      if (cached) {
        console.log(`⚡ [Cache HIT] ${cacheKey}`)
        return NextResponse.json({ success: true, date: shortDate, total: cached.total, leagues: cached.leagues, cached: true })
      }
    } catch { /* ignore cache errors */ }

    console.log('='.repeat(60))
    console.log(`🏅 MATCHES API - Sport: ${sport}`)
    console.log('='.repeat(60))
    console.log(`📅 Filter: ${dateFilter}`)
    console.log(`🎯 Priority only: ${priorityOnly}`)

    // Calculer la date cible
    const targetDate = new Date()
    if (dateFilter === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1)
    } else if (dateFilter === 'day-after') {
      targetDate.setDate(targetDate.getDate() + 2)
    }

    // Récupérer le service correspondant au sport demandé
    const service = await getServiceForSport(sport)

    // Récupérer les matchs
    const matches = priorityOnly
      ? await service.getPriorityMatches()
      : await service.getMatchesByDate(targetDate)

    if (matches.length === 0) {
      console.log('⚠️ Aucun match trouvé')
      return NextResponse.json({
        success: true,
        date: shortDate,
        total: 0,
        leagues: [],
        message: `Aucun match trouve pour ${shortDate}`,
      })
    }

    // Enrichir les matchs avec la date formatée
    const enrichedMatches: Match[] = matches.map((m) => ({
      ...m,
      date: shortDate,
    }))

    // Grouper par ligue
    const leagues = groupMatchesByLeague(enrichedMatches)

    console.log('='.repeat(60))
    console.log(`📊 TOTAL: ${enrichedMatches.length} matchs trouvés`)
    leagues.forEach(lg => {
      console.log(`   🏆 ${lg.league}: ${lg.matches.length} match(es)`)
    })
    console.log('='.repeat(60))

    // ── Écriture cache Redis ───────────────────────────────────
    try {
      await redis.set(cacheKey, { leagues, total: enrichedMatches.length }, { ex: cacheTTL })
    } catch { /* ignore cache errors */ }

    return NextResponse.json({
      success: true,
      date: shortDate,
      total: enrichedMatches.length,
      leagues,
    })

  } catch (error) {
    console.error('❌ Matches API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur serveur',
        leagues: [],
      },
      { status: 500 }
    )
  }
}
