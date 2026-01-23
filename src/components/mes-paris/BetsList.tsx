'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ServerBet } from '@/types'
import { Clock, CheckCircle, XCircle, Filter, Calendar, Target } from 'lucide-react'

interface BetsListProps {
  bets: ServerBet[]
  isLoading: boolean
}

type FilterType = 'all' | 'pending' | 'won' | 'lost'

const filters: { id: FilterType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'Tous', icon: <Filter className="w-4 h-4" />, color: 'text-white' },
  { id: 'pending', label: 'En cours', icon: <Clock className="w-4 h-4" />, color: 'text-yellow-400' },
  { id: 'won', label: 'Gagnes', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400' },
  { id: 'lost', label: 'Perdus', icon: <XCircle className="w-4 h-4" />, color: 'text-red-400' },
]

export default function BetsList({ bets, isLoading }: BetsListProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const filteredBets = activeFilter === 'all'
    ? bets
    : bets.filter(bet => bet.status === activeFilter)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            En cours
          </span>
        )
      case 'won':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            Gagne
          </span>
        )
      case 'lost':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Perdu
          </span>
        )
      default:
        return null
    }
  }

  const getTicketTypeBadge = (type: string) => {
    return type === 'safe' ? (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
        SAFE
      </span>
    ) : (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
        FUN
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-dark-700 rounded-xl p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-dark-600 rounded-lg w-1/3" />
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-dark-600 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-700 rounded-xl border border-white/10 overflow-hidden">
      {/* Header avec filtres */}
      <div className="p-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold">Historique des Paris</h3>

          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  activeFilter === filter.id
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'bg-dark-600 text-white/70 border border-white/10 hover:bg-dark-500'
                }`}
              >
                <span className={filter.color}>{filter.icon}</span>
                {filter.label}
                {filter.id !== 'all' && (
                  <span className="ml-1 text-xs opacity-70">
                    ({bets.filter(b => filter.id === 'all' || b.status === filter.id).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="divide-y divide-white/5">
        <AnimatePresence mode="popLayout">
          {filteredBets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center text-white/50"
            >
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun pari {activeFilter !== 'all' ? `${filters.find(f => f.id === activeFilter)?.label.toLowerCase()}` : ''}</p>
            </motion.div>
          ) : (
            filteredBets.map((bet, index) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Info match */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getTicketTypeBadge(bet.ticketType)}
                      <span className="text-white/50 text-xs">{bet.league}</span>
                    </div>
                    <div className="font-medium">
                      {bet.homeTeam} vs {bet.awayTeam}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      <span className="text-neon-green">{bet.market}</span>
                      {bet.selection && <span> - {bet.selection}</span>}
                    </div>
                  </div>

                  {/* Info pari */}
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-right">
                      <div className="text-xs text-white/50 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(bet.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm">
                        Cote: <span className="font-medium text-white">{bet.odds.toFixed(2)}</span>
                      </div>
                      <div className="text-sm">
                        Mise: <span className="font-medium">{bet.stake.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      {getStatusBadge(bet.status)}
                      {bet.status === 'won' && (
                        <div className="text-green-400 text-sm font-medium mt-1">
                          +{(bet.potentialWin - bet.stake).toFixed(2)}
                        </div>
                      )}
                      {bet.status === 'lost' && (
                        <div className="text-red-400 text-sm font-medium mt-1">
                          -{bet.stake.toFixed(2)}
                        </div>
                      )}
                      {bet.status === 'pending' && (
                        <div className="text-white/50 text-sm mt-1">
                          Gain: {bet.potentialWin.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer avec total */}
      {filteredBets.length > 0 && (
        <div className="p-4 border-t border-white/10 bg-dark-800/50">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">{filteredBets.length} paris affiches</span>
            <span className="text-white/60">
              Total mise: <span className="text-white font-medium">
                {filteredBets.reduce((sum, bet) => sum + bet.stake, 0).toFixed(2)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
