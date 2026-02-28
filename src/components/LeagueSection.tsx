'use client'

import { motion } from 'framer-motion'
import { Match, LEAGUE_COLORS, VIPTickets } from '@/types'
import { getSportConfig } from '@/lib/config/sports'
import MatchCard from './MatchCard'

interface MatchBadges {
  isValue?: boolean
  isSafe?: boolean
}

interface LeagueSectionProps {
  league: string
  matches: Match[]
  onGeneratePronostic: (match: Match) => void
  loadingMatchId: string | null
  analyzedMatches?: Map<string, MatchBadges>
  ticketDataMap?: Map<string, VIPTickets>
  ticketViewMode?: boolean
  favorites?: Set<string>
  onToggleFavorite?: (matchId: string) => void
  hideHeader?: boolean
}

export default function LeagueSection({
  league,
  matches,
  onGeneratePronostic,
  loadingMatchId,
  analyzedMatches = new Map(),
  ticketDataMap,
  ticketViewMode = false,
  favorites = new Set(),
  onToggleFavorite,
  hideHeader = false,
}: LeagueSectionProps) {
  if (matches.length === 0) return null

  const sportColor = matches[0]?.sport ? getSportConfig(matches[0].sport).color : '#4B5563'
  const leagueColor = LEAGUE_COLORS[league] || sportColor

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-3"
    >
      {/* ── Section header — Spotlight style ─────────────────── */}
      {!hideHeader && (
        <div className="flex items-center gap-3 px-1">
          <div
            className="w-1 h-5 rounded-full flex-shrink-0"
            style={{ backgroundColor: leagueColor, boxShadow: `0 0 8px ${leagueColor}50` }}
          />
          <h2 className="text-[13px] font-semibold text-white/80 tracking-wide flex-1">
            {league}
          </h2>
          <div className="px-2.5 py-0.5 rounded-pill bg-white/[0.06] border border-white/[0.08]">
            <span className="text-[11px] font-medium text-white/45">
              {matches.length} match{matches.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* ── Matches Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {matches.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <MatchCard
              match={match}
              onGeneratePronostic={onGeneratePronostic}
              isLoading={loadingMatchId === match.id}
              badges={analyzedMatches.get(match.id)}
              ticketData={ticketDataMap?.get(match.id)}
              ticketViewMode={ticketViewMode}
              isFavorite={favorites.has(match.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
