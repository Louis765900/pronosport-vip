'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, RefreshCw, Calendar, Trophy, Loader2, Crosshair, Flame, Gem } from 'lucide-react'
import { Toaster } from 'sonner'
import { Header, LeagueSection, PronosticResult, AnalysisLoader } from '@/components'
import { usePronostic } from '@/hooks/usePronostic'
import { LeagueGroup, DateFilter, Match, PronosticResponse } from '@/types'

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

export function DashboardClient() {
  const [selectedDate, setSelectedDate] = useState<DateFilter>('today')
  const [leagues, setLeagues] = useState<LeagueGroup[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [isLoadingMatches, setIsLoadingMatches] = useState(true)
  const [matchesError, setMatchesError] = useState<string | null>(null)
  const [sniperMode, setSniperMode] = useState(false)
  const [analyzedMatches, setAnalyzedMatches] = useState<Map<string, AnalyzedMatch>>(new Map())

  const {
    isLoading: isAnalyzing,
    loadingMatchId,
    error: pronosticError,
    currentPronostic,
    selectedMatch,
    generatePronostic,
    clearPronostic,
  } = usePronostic()

  // Store analyzed match data when pronostic is generated
  useEffect(() => {
    if (currentPronostic && selectedMatch) {
      const evValue = currentPronostic.vip_tickets.fun.ev_value || 0
      const confidence = currentPronostic.vip_tickets.safe.confidence || 0

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
      const response = await fetch(`/api/matches?date=${dateFilter}`)
      const data: MatchesAPIResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des matchs')
      }

      setLeagues(data.leagues || [])
      setTotalMatches(data.total || 0)
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

  useEffect(() => {
    fetchMatches(selectedDate)
  }, [selectedDate, fetchMatches])

  // Filter leagues based on sniper mode
  const filteredLeagues = useMemo(() => {
    if (!sniperMode) return leagues

    return leagues
      .map(league => ({
        ...league,
        matches: league.matches.filter(match => {
          const analyzed = analyzedMatches.get(match.id)
          if (!analyzed) return false // Only show analyzed matches in sniper mode
          return analyzed.badges.isValue || analyzed.badges.isSafe
        })
      }))
      .filter(league => league.matches.length > 0)
  }, [leagues, sniperMode, analyzedMatches])

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

  const handleDateChange = (date: DateFilter) => {
    setSelectedDate(date)
    setAnalyzedMatches(new Map()) // Clear analyzed matches when changing date
  }

  const handleRefresh = () => {
    fetchMatches(selectedDate)
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

  return (
    <>
        {/* Controls Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 md:gap-4 mb-6 md:mb-8"
        >
          {/* Date Filter Tabs - Full width on mobile */}
          <div className="w-full md:w-auto flex items-center justify-center gap-1 md:gap-2 bg-dark-700 rounded-xl p-1">
            {dateFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleDateChange(filter.id)}
                className={`
                  flex-1 md:flex-none px-3 md:px-4 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedDate === filter.id
                    ? 'bg-neon-green text-dark-900'
                    : 'text-white/70 hover:text-white hover:bg-dark-600'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Second row: Sniper + Date + Refresh */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Sniper Mode Toggle */}
            <motion.button
              onClick={() => setSniperMode(!sniperMode)}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-xl font-medium text-sm transition-all
                ${sniperMode
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-dark-700 text-white/70 hover:text-white hover:bg-dark-600'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Crosshair className={`w-5 h-5 md:w-4 md:h-4 ${sniperMode ? 'animate-pulse' : ''}`} />
              Mode Sniper
              {sniperMatchCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${ 
                  sniperMode ? 'bg-white/20' : 'bg-neon-green/20 text-neon-green'
                }`}>
                  {sniperMatchCount}
                </span>
              )}
            </motion.button>

            {/* Date display + Refresh */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 bg-dark-700/50 rounded-lg">
                <Calendar className="w-4 h-4 text-neon-green" />
                <span className="text-sm text-white/70 capitalize">{getDateLabel()}</span>
              </div>

              <button
                onClick={handleRefresh}
                disabled={isLoadingMatches}
                className="flex items-center justify-center p-3 md:p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
              >
                <RefreshCw
                  className={`w-5 h-5 md:w-4 md:h-4 text-white/70 ${isLoadingMatches ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Sniper Mode Info */}
        <AnimatePresence>
          {sniperMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 md:mb-6"
            >
              <div className="p-3 md:p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Crosshair className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                  <h3 className="text-sm md:text-base font-semibold text-white">Mode Sniper Active</h3>
                </div>
                <p className="text-xs md:text-sm text-white/70 mb-3">
                  Seuls les matchs analyses avec une Value (EV) &gt; 5% ou une Confiance &gt; 80% sont affiches.
                  Analysez des matchs pour decouvrir les pepites !
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1.5 md:py-1 bg-orange-500/90 rounded-full">
                      <Flame className="w-3 h-3 text-white" />
                      <span className="font-bold text-white">VALUE</span>
                    </div>
                    <span className="text-white/50">= EV &gt; 5%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1.5 md:py-1 bg-blue-500/90 rounded-full">
                      <Gem className="w-3 h-3 text-white" />
                      <span className="font-bold text-white">SAFE</span>
                    </div>
                    <span className="text-white/50">= Confiance &gt;= 80%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-6 md:mb-8 px-2"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs md:text-sm text-white/60">
              {sniperMode ? filteredLeagues.reduce((acc, l) => acc + l.matches.length, 0) : totalMatches} match{totalMatches !== 1 ? 's' : ''} {sniperMode ? 'detecte(s)' : 'disponible(s)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
            <span className="text-xs md:text-sm text-white/60">
              {sniperMode ? filteredLeagues.length : leagues.length} competition{leagues.length !== 1 ? 's' : ''}
            </span>
          </div>
          {analyzedMatches.size > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
              <span className="text-xs md:text-sm text-white/60">
                {analyzedMatches.size} analyse(s)
              </span>
            </div>
          )}
        </motion.div>

        {/* Error Alerts */}
        <AnimatePresence>
          {(matchesError || pronosticError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 md:mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start md:items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 md:mt-0" />
              <p className="text-red-300 text-xs md:text-sm">{matchesError || pronosticError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {isLoadingMatches ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mb-4"
            >
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-neon-green" />
            </motion.div>
            <p className="text-white/60 text-xs md:text-sm text-center">Recherche des matchs via Perplexity AI...</p>
            <p className="text-white/40 text-xs mt-2 text-center">Cela peut prendre quelques secondes</p>
          </div>
        ) : filteredLeagues.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 md:py-20 px-4"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-dark-700 rounded-full flex items-center justify-center">
              {sniperMode ? (
                <Crosshair className="w-8 h-8 md:w-10 md:h-10 text-orange-400/50" />
              ) : (
                <Calendar className="w-8 h-8 md:w-10 md:h-10 text-white/30" />
              )}
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
              {sniperMode ? 'Aucune pepite detectee' : 'Aucun match disponible'}
            </h3>
            <p className="text-sm md:text-base text-white/50 max-w-md mx-auto">
              {sniperMode
                ? 'Analysez des matchs pour decouvrir les meilleures opportunites. Les matchs avec EV > 5% ou Confiance >= 80% apparaitront ici.'
                : 'Il n\'y a pas de match programme pour cette date dans les ligues majeures. Essayez une autre date ou revenez plus tard.'
              }
            </p>
            {sniperMode && (
              <button
                onClick={() => setSniperMode(false)}
                className="mt-4 px-4 py-3 md:py-2 bg-dark-700 hover:bg-dark-600 text-white/70 hover:text-white rounded-lg transition-colors text-sm min-h-[44px]"
              >
                Desactiver le Mode Sniper
              </button>
            )}
          </motion.div>
        ) : (
          /* Leagues */
          <div className="space-y-6 md:space-y-10">
            {filteredLeagues.map((leagueData) => (
              <LeagueSection
                key={leagueData.league}
                league={leagueData.league}
                matches={leagueData.matches}
                onGeneratePronostic={generatePronostic}
                loadingMatchId={loadingMatchId}
                analyzedMatches={badgesMap}
              />
            ))}
          </div>
        )}

      {/* Analysis Loader Modal */}
      <AnimatePresence>
        {isAnalyzing && !currentPronostic && (
          <AnalysisLoader
            isVisible={isAnalyzing}
            matchName={getAnalyzingMatchName()}
          />
        )}
      </AnimatePresence>

      {/* Pronostic Result Modal */}
      <AnimatePresence>
        {currentPronostic && selectedMatch && (
          <PronosticResult
            match={selectedMatch}
            pronostic={currentPronostic}
            onClose={clearPronostic}
          />
        )}
      </AnimatePresence>
    </>
  )
}
