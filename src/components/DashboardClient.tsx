'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle, RefreshCw, Calendar, Trophy, Loader2, Crosshair,
  Flame, Search, ChevronDown, Star, X
} from 'lucide-react'
import { Toaster } from 'sonner'
import { Header, LeagueSection, PronosticResult, AnalysisLoader } from '@/components'
import { SportContextBanner } from '@/components/SportContextBanner'
import { usePronostic } from '@/hooks/usePronostic'
import { LeagueGroup, DateFilter, Match, PronosticResponse, VIPTickets } from '@/types'
import { SPORT_LEAGUES } from '@/lib/config/sportLeagues'
import { DEFAULT_SPORT } from '@/lib/config/sports'
import type { SportId } from '@/lib/config/sports'

interface MatchesAPIResponse {
  success: boolean
  date: string
  total: number
  leagues: LeagueGroup[]
  error?: string
}

interface MatchBadges {
  isValue?: boolean
  isSafe?: boolean
}

interface AnalyzedMatch {
  matchId: string
  badges: MatchBadges
  pronostic: PronosticResponse
}

const dateFilters: { id: DateFilter; label: string }[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'tomorrow', label: 'Demain' },
  { id: 'day-after', label: 'J+2' },
]

const MATCHES_PER_PAGE = 10

export function DashboardClient({ sport = DEFAULT_SPORT }: { sport?: SportId }) {
  // Filtres de compétitions dynamiques selon le sport actif
  const leagueFilters = SPORT_LEAGUES[sport] ?? SPORT_LEAGUES[DEFAULT_SPORT]
  const [selectedDate, setSelectedDate] = useState<DateFilter>('today')
  const [leagues, setLeagues] = useState<LeagueGroup[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [isLoadingMatches, setIsLoadingMatches] = useState(true)
  const [matchesError, setMatchesError] = useState<string | null>(null)
  const [sniperMode, setSniperMode] = useState(false)
  const [analyzedMatches, setAnalyzedMatches] = useState<Map<string, AnalyzedMatch>>(new Map())

  // Nouveaux etats pour les filtres et la recherche
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(MATCHES_PER_PAGE)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set())

  const {
    isLoading: isAnalyzing,
    loadingMatchId,
    error: pronosticError,
    currentPronostic,
    selectedMatch,
    generatePronostic,
    clearPronostic,
  } = usePronostic()

  // Charger les favoris depuis localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteMatches')
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)))
      } catch (e) {
        console.error('Error loading favorites:', e)
      }
    }
  }, [])

  // Sauvegarder les favoris
  const toggleFavorite = useCallback((matchId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(matchId)) {
        newFavorites.delete(matchId)
      } else {
        newFavorites.add(matchId)
      }
      localStorage.setItem('favoriteMatches', JSON.stringify(Array.from(newFavorites)))
      return newFavorites
    })
  }, [])

  // Store analyzed match data when pronostic is generated
  useEffect(() => {
    if (currentPronostic && selectedMatch) {
      // FIX: Safe access with optional chaining
      const evValue = currentPronostic?.vip_tickets?.fun?.ev_value ?? 0
      const confidence = currentPronostic?.vip_tickets?.safe?.confidence ?? 0

      const badges: MatchBadges = {
        isValue: evValue > 5,
        isSafe: confidence >= 80
      }

      setAnalyzedMatches(prev => {
        const newMap = new Map(prev)
        newMap.set(selectedMatch.id, {
          matchId: selectedMatch.id,
          badges,
          pronostic: currentPronostic
        })
        return newMap
      })
    }
  }, [currentPronostic, selectedMatch])

  const fetchMatches = useCallback(async (dateFilter: DateFilter) => {
    setIsLoadingMatches(true)
    setMatchesError(null)

    try {
      const response = await fetch(`/api/matches?date=${dateFilter}&sport=${sport}`)
      const data: MatchesAPIResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des matchs')
      }

      setLeagues(data.leagues || [])
      setTotalMatches(data.total || 0)
      setVisibleMatchesCount(MATCHES_PER_PAGE) // Reset pagination
    } catch (err) {
      console.error('Error fetching matches:', err)
      setMatchesError(
        err instanceof Error ? err.message : 'Impossible de charger les matchs'
      )
      setLeagues([])
      setTotalMatches(0)
    } finally {
      setIsLoadingMatches(false)
    }
  }, [])

  // Recharger et réinitialiser quand le sport ou la date changent
  useEffect(() => {
    setSelectedLeagueFilter('all')
    setAnalyzedMatches(new Map())
    setSearchQuery('')
    fetchMatches(selectedDate)
  }, [selectedDate, sport, fetchMatches])

  // Filtrage avance des matchs
  const filteredLeagues = useMemo(() => {
    let result = leagues

    // Filtre par competition
    if (selectedLeagueFilter !== 'all') {
      result = result.filter(league => {
        const leagueName = league.league.toLowerCase()
        const filter = selectedLeagueFilter.toLowerCase().replace(/-/g, ' ')
        return leagueName.includes(filter) || filter.includes(leagueName.split(' ')[0])
      })
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result
        .map(league => ({
          ...league,
          matches: league.matches.filter(match =>
            match.homeTeam.toLowerCase().includes(query) ||
            match.awayTeam.toLowerCase().includes(query) ||
            league.league.toLowerCase().includes(query)
          )
        }))
        .filter(league => league.matches.length > 0)
    }

    // Filtre favoris
    if (showFavoritesOnly) {
      result = result
        .map(league => ({
          ...league,
          matches: league.matches.filter(match => favorites.has(match.id))
        }))
        .filter(league => league.matches.length > 0)
    }

    // Mode Sniper
    if (sniperMode) {
      result = result
        .map(league => ({
          ...league,
          matches: league.matches.filter(match => {
            const analyzed = analyzedMatches.get(match.id)
            if (!analyzed) return false
            return analyzed.badges.isValue || analyzed.badges.isSafe
          })
        }))
        .filter(league => league.matches.length > 0)
    }

    return result
  }, [leagues, selectedLeagueFilter, searchQuery, showFavoritesOnly, favorites, sniperMode, analyzedMatches])

  // Pagination - limiter les matchs affiches
  const paginatedLeagues = useMemo(() => {
    let matchCount = 0
    const result: LeagueGroup[] = []

    for (const league of filteredLeagues) {
      if (matchCount >= visibleMatchesCount) break

      const remainingSlots = visibleMatchesCount - matchCount
      const matchesToShow = league.matches.slice(0, remainingSlots)

      if (matchesToShow.length > 0) {
        result.push({
          ...league,
          matches: matchesToShow
        })
        matchCount += matchesToShow.length
      }
    }

    return result
  }, [filteredLeagues, visibleMatchesCount])

  // Total des matchs apres filtrage
  const totalFilteredMatches = useMemo(() => {
    return filteredLeagues.reduce((acc, league) => acc + league.matches.length, 0)
  }, [filteredLeagues])

  // Count live matches (has score + not finished)
  const liveMatchCount = useMemo(() => {
    return leagues
      .flatMap(l => l.matches)
      .filter(m => m.homeScore !== undefined && m.homeScore !== null && !m.isFinished)
      .length
  }, [leagues])

  // Count sniper matches
  const sniperMatchCount = useMemo(() => {
    let count = 0
    analyzedMatches.forEach(match => {
      if (match.badges.isValue || match.badges.isSafe) count++
    })
    return count
  }, [analyzedMatches])

  // Get badges map for LeagueSection
  const badgesMap = useMemo(() => {
    const map = new Map<string, MatchBadges>()
    analyzedMatches.forEach((data, matchId) => {
      map.set(matchId, data.badges)
    })
    return map
  }, [analyzedMatches])

  // Get ticket data map for ticket preview in sniper mode
  const ticketDataMap = useMemo(() => {
    const map = new Map<string, VIPTickets>()
    analyzedMatches.forEach((data, matchId) => {
      if (data.pronostic?.vip_tickets) {
        map.set(matchId, data.pronostic.vip_tickets)
      }
    })
    return map
  }, [analyzedMatches])

  const handleDateChange = (date: DateFilter) => {
    setSelectedDate(date)
    setAnalyzedMatches(new Map())
    setSearchQuery('')
    setSelectedLeagueFilter('all')
    setVisibleMatchesCount(MATCHES_PER_PAGE)
  }

  const handleRefresh = () => {
    fetchMatches(selectedDate)
  }

  const handleLoadMore = () => {
    setVisibleMatchesCount(prev => prev + MATCHES_PER_PAGE)
  }

  const toggleLeagueCollapse = (leagueName: string) => {
    setCollapsedLeagues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leagueName)) {
        newSet.delete(leagueName)
      } else {
        newSet.add(leagueName)
      }
      return newSet
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLeagueFilter('all')
    setShowFavoritesOnly(false)
    setSniperMode(false)
  }

  const getDateLabel = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }

    if (selectedDate === 'today') {
      return today.toLocaleDateString('fr-FR', options)
    } else if (selectedDate === 'tomorrow') {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toLocaleDateString('fr-FR', options)
    } else if (selectedDate === 'day-after') {
      const dayAfter = new Date(today)
      dayAfter.setDate(dayAfter.getDate() + 2)
      return dayAfter.toLocaleDateString('fr-FR', options)
    }
    return ''
  }

  const getAnalyzingMatchName = () => {
    if (!selectedMatch) return ''
    return `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}`
  }

  const hasActiveFilters = searchQuery || selectedLeagueFilter !== 'all' || showFavoritesOnly || sniperMode

  return (
    <>
      {/* ── SPOTLIGHT SEARCH ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une équipe ou compétition…"
            className="w-full pl-11 pr-10 py-3 rounded-macos text-[14px] text-white placeholder-white/30 outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
            onFocus={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.07)'
            }}
            onBlur={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/16 transition-colors"
            >
              <X className="w-3 h-3 text-white/50" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ── DATE TABS — iOS Segmented Control ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5"
      >
        <div
          className="flex items-center p-1 rounded-macos gap-1"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {dateFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleDateChange(filter.id)}
              className={`
                flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-200
                ${selectedDate === filter.id
                  ? 'bg-amber-500 text-black shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                  : 'text-white/55 hover:text-white/80'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Date label */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <Calendar className="w-3 h-3 text-white/30" />
          <span className="text-[12px] text-white/35 capitalize">{getDateLabel()}</span>
        </div>
      </motion.div>

      {/* ── COMPETITION CHIPS — horizontal scroll ───────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="mb-3"
      >
        <div className="overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-1 min-w-max">
            {leagueFilters.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeagueFilter(league.id)}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-pill text-[11px] font-medium
                  transition-all duration-150 whitespace-nowrap
                  ${selectedLeagueFilter === league.id
                    ? 'bg-amber-500 text-black shadow-[0_1px_6px_rgba(245,158,11,0.25)]'
                    : 'text-white/45 hover:text-white/70'
                  }
                `}
                style={selectedLeagueFilter !== league.id ? {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                } : {}}
              >
                <span className="text-[11px]">{league.icon}</span>
                <span>{league.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── ACTION PILLS ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-2 mb-4"
      >
        {/* Favoris */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] font-medium transition-all duration-150 ${
            showFavoritesOnly
              ? 'bg-amber-400/15 text-amber-400 border border-amber-400/25'
              : 'text-white/55 hover:text-white/80'
          }`}
          style={!showFavoritesOnly ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
        >
          <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400' : ''}`} />
          Favoris
          {favorites.size > 0 && (
            <span className="px-1.5 py-0 bg-amber-400/20 rounded-full text-[10px] font-bold tabular-nums">
              {favorites.size}
            </span>
          )}
        </button>

        {/* Sniper / Tickets mode */}
        <button
          onClick={() => setSniperMode(!sniperMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] font-medium transition-all duration-150 ${
            sniperMode
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-white/55 hover:text-white/80'
          }`}
          style={!sniperMode ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
          title="Affiche les tickets SAFE & FUN directement sur les cartes"
        >
          <Crosshair className={`w-3.5 h-3.5 ${sniperMode ? 'animate-pulse' : ''}`} />
          {sniperMode ? 'Vue Tickets' : 'Sniper'}
          {sniperMatchCount > 0 && (
            <span className="px-1.5 py-0 bg-orange-500/20 rounded-full text-[10px] font-bold tabular-nums">
              {sniperMatchCount}
            </span>
          )}
        </button>

        {/* Clear */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-pill text-[12px] text-white/35 hover:text-white/60 transition-colors"
            >
              <X className="w-3 h-3" />
              Effacer
            </motion.button>
          )}
        </AnimatePresence>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isLoadingMatches}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12px] text-white/55 hover:text-white/80 transition-all disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMatches ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </motion.div>

      {/* ── SNIPER ACTIVE HINT ──────────────────────────────────── */}
      <AnimatePresence>
        {sniperMode && analyzedMatches.size === 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mb-3 overflow-hidden"
          >
            <p className="text-[12px] text-white/35 text-center py-2">
              Analysez des matchs pour voir leurs tickets SAFE & FUN directement ici.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SPORT CONTEXT BANNER ────────────────────────────────── */}
      <SportContextBanner sport={sport} />

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="flex items-center gap-4 mb-4 px-0.5"
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={liveMatchCount > 0
              ? { opacity: [1, 0.25, 1], scale: [1, 1.35, 1] }
              : { opacity: [1, 0.45, 1] }
            }
            transition={{ duration: liveMatchCount > 0 ? 1 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${liveMatchCount > 0 ? 'bg-apple-green' : 'bg-white/20'}`}
          />
          {liveMatchCount > 0 && (
            <span className="text-[11px] font-semibold text-apple-green">{liveMatchCount} LIVE ·</span>
          )}
          <span className="text-[12px] text-white/40">
            {totalFilteredMatches} match{totalFilteredMatches !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-[12px] text-white/40">
          {paginatedLeagues.length} compétition{paginatedLeagues.length !== 1 ? 's' : ''}
        </span>
        {analyzedMatches.size > 0 && (
          <>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[12px] text-amber-500/70">
              {analyzedMatches.size} analysé{analyzedMatches.size !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </motion.div>

      {/* ── ERROR ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {(matchesError || pronosticError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3.5 rounded-macos flex items-start gap-3"
            style={{ background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.20)' }}
          >
            <AlertCircle className="w-4 h-4 text-apple-red flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-300/90">{matchesError || pronosticError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      {isLoadingMatches ? (
        /* Loading */
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
            <Loader2 className="w-8 h-8 text-amber-500/70" />
          </motion.div>
          <p className="text-[13px] text-white/35">Chargement des matchs…</p>
        </div>

      ) : paginatedLeagues.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-4"
        >
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-[18px] flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {hasActiveFilters
              ? <Search className="w-6 h-6 text-white/25" />
              : <Calendar className="w-6 h-6 text-white/25" />
            }
          </div>
          <h3 className="text-[15px] font-semibold text-white/80 mb-1.5">
            {hasActiveFilters ? 'Aucun résultat' : 'Aucun match disponible'}
          </h3>
          <p className="text-[13px] text-white/35 max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? 'Essayez de modifier vos filtres ou votre recherche.'
              : "Pas de match programmé pour cette date. Essayez une autre."
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-5 py-2 rounded-pill text-[13px] font-medium text-amber-400 transition-colors"
              style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.20)' }}
            >
              Effacer les filtres
            </button>
          )}
        </motion.div>

      ) : (
        /* Leagues */
        <div className="space-y-3">
          {paginatedLeagues.map((leagueData, i) => (
            <motion.div
              key={leagueData.league}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-ios"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* League Accordion Header */}
              <button
                onClick={() => toggleLeagueCollapse(leagueData.league)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500/70" />
                  <span className="text-[13px] font-semibold text-white/85">{leagueData.league}</span>
                  <span
                    className="px-2 py-0.5 rounded-pill text-[10px] font-medium text-white/40"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {leagueData.matches.length}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: collapsedLeagues.has(leagueData.league) ? -90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-white/25" />
                </motion.div>
              </button>

              {/* Separator */}
              {!collapsedLeagues.has(leagueData.league) && (
                <div className="mx-4 h-px bg-white/[0.04]" />
              )}

              {/* League Content */}
              <AnimatePresence>
                {!collapsedLeagues.has(leagueData.league) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="p-3">
                      <LeagueSection
                        league={leagueData.league}
                        matches={leagueData.matches}
                        onGeneratePronostic={generatePronostic}
                        loadingMatchId={loadingMatchId}
                        analyzedMatches={badgesMap}
                        ticketDataMap={ticketDataMap}
                        ticketViewMode={sniperMode}
                        favorites={favorites}
                        onToggleFavorite={toggleFavorite}
                        hideHeader={true}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Load more */}
          {visibleMatchesCount < totalFilteredMatches && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-2"
            >
              <button
                onClick={handleLoadMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-pill text-[13px] font-medium text-white/50 hover:text-white/75 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <ChevronDown className="w-4 h-4" />
                {totalFilteredMatches - visibleMatchesCount} matchs supplémentaires
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* ── ANALYSIS LOADER ─────────────────────────────────────── */}
      <AnimatePresence>
        {isAnalyzing && !currentPronostic && (
          <AnalysisLoader isVisible={isAnalyzing} matchName={getAnalyzingMatchName()} />
        )}
      </AnimatePresence>

      {/* ── PRONOSTIC MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {currentPronostic && selectedMatch && (
          <PronosticResult
            match={selectedMatch}
            pronostic={currentPronostic}
            onClose={clearPronostic}
            onRefresh={() => generatePronostic(selectedMatch, true)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
