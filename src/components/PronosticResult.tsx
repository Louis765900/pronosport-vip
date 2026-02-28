'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, TrendingUp, TrendingDown, AlertTriangle, Target,
  Brain, Users, Zap, Shield, Ticket, BarChart3, FileText,
  CheckCircle2, DollarSign, Percent, Cloud, Gavel, RefreshCw,
  LayoutGrid
} from 'lucide-react'
import { Match, PronosticResponse, AdditionalMarket, getTeamColor, getTeamInitials } from '@/types'
import { RadarStats, H2HBar, EVGauge } from './charts'
import { BetButton } from './bankroll'
import { ShareButton } from './social'
import { ChatWidget } from './chat'
import { getSportConfig, getSportUIConfig } from '@/lib/config/sports'

interface PronosticResultProps {
  match: Match
  pronostic: PronosticResponse
  onClose: () => void
  onRefresh?: () => void
}

type TabId = 'synthese' | 'stats' | 'tickets'

function TeamLogo({ teamName, size = 'sm' }: { teamName: string; size?: 'sm' | 'lg' }) {
  const initials = getTeamInitials(teamName)
  const color = getTeamColor(teamName)
  const sizeClass = size === 'lg' ? 'w-10 h-10 md:w-12 md:h-12 text-base md:text-lg' : 'w-6 h-6 md:w-8 md:h-8 text-[10px] md:text-xs'

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

export default function PronosticResult({ match, pronostic, onClose, onRefresh }: PronosticResultProps) {
  const [activeTab, setActiveTab] = useState<TabId>('synthese')
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const sport = match.sport ?? 'football'
  const sportConfig = getSportConfig(sport)
  const sportUI = getSportUIConfig(sport)

  // Focus trap & keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    setTimeout(() => closeButtonRef.current?.focus(), 50)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'synthese', label: 'Synthese', icon: <FileText className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats Pro', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'tickets', label: 'Tickets VIP', icon: <Ticket className="w-4 h-4" /> },
  ]

  const getSelectionLabel = (selection: '1' | 'N' | '2') => {
    if (selection === '1') return match.homeTeam
    if (selection === '2') return match.awayTeam
    return 'Match Nul'
  }

  const hasAdditionalMarkets = Array.isArray(pronostic.additional_markets) && pronostic.additional_markets.length > 0

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pronostic-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center md:p-4"
        style={{ backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }}
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card rounded-t-[24px] md:rounded-[24px] max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col"
          style={{ boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.08) inset' }}
        >
          {/* Header */}
          <div className="border-b border-white/[0.07] p-4 md:p-6" style={{ background: 'rgba(8,8,10,0.7)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div
                  className="p-1.5 md:p-2 rounded-lg md:rounded-xl flex-shrink-0"
                  style={{ background: `${sportConfig.color}22` }}
                >
                  <span className="text-lg md:text-xl" role="img" aria-label={sportConfig.label}>
                    {sportConfig.emoji}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id="pronostic-title" className="text-base md:text-xl font-bold text-white">
                      Analyse PronoScope
                    </h2>
                    <span
                      className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: `${sportConfig.color}20`, color: sportConfig.color }}
                    >
                      {sportUI.contextLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 mt-1 flex-wrap">
                    <TeamLogo teamName={match.homeTeam} />
                    <span className="text-white/60 text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{match.homeTeam}</span>
                    <span className="text-white/40 text-[10px] md:text-xs">vs</span>
                    <span className="text-white/60 text-xs md:text-sm truncate max-w-[80px] md:max-w-none">{match.awayTeam}</span>
                    <TeamLogo teamName={match.awayTeam} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    title="Regénérer l'analyse (efface le cache)"
                    aria-label="Regénérer l'analyse"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    <RefreshCw className="w-4 h-4 text-white/40 hover:text-amber-400 transition-colors" />
                  </button>
                )}
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  aria-label="Fermer l'analyse"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 -mx-1 px-1"
              role="tablist"
              aria-label="Onglets d'analyse"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 min-h-[40px]
                    ${activeTab === tab.id ? 'text-black font-semibold' : 'text-white/55 hover:text-white/80'}`}
                  style={activeTab === tab.id
                    ? { background: sportConfig.color, boxShadow: `0 1px 6px ${sportConfig.color}55` }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <AnimatePresence mode="wait">

              {/* ── SYNTHÈSE ── */}
              {activeTab === 'synthese' && (
                <motion.div
                  key="synthese"
                  id="panel-synthese"
                  role="tabpanel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4 md:space-y-6"
                >
                  <div className="bg-white/[0.04] rounded-[14px] border border-white/[0.06] p-4 md:p-5">
                    <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2" style={{ color: sportConfig.color }}>
                      <FileText className="w-4 h-4" />
                      CONTEXTE {sportUI.contextLabel}
                    </h3>
                    <p className="text-sm md:text-base text-white/80 leading-relaxed">
                      {pronostic.analysis.context}
                    </p>
                  </div>

                  <div
                    className="rounded-[14px] p-4 md:p-5"
                    style={{ background: `${sportConfig.color}13`, border: `1px solid ${sportConfig.color}38` }}
                  >
                    <h3 className="text-xs md:text-sm font-semibold text-white/70 mb-3 md:mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" style={{ color: sportConfig.color }} />
                      {sportUI.predictionLabel.toUpperCase()}
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xl md:text-3xl font-bold" style={{ color: sportConfig.color }}>
                          {getSelectionLabel(pronostic.predictions.main_market.selection)}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                          <span className="text-white/60 text-xs md:text-sm">
                            Probabilité: <span className="text-white font-medium">{pronostic.predictions.main_market.probability_percent ?? pronostic.predictions.main_market.confidence ?? 0}%</span>
                          </span>
                          <span className="text-white/60 text-xs md:text-sm">
                            Fair Odds: <span className="font-medium" style={{ color: sportConfig.color }}>{(pronostic.predictions.main_market.fair_odds ?? pronostic.predictions.main_market.odds_estimated ?? 0).toFixed(2)}</span>
                          </span>
                        </div>
                        {pronostic.predictions.main_market.reason && (
                          <p className="text-white/60 text-xs mt-2 leading-relaxed max-w-sm">
                            {pronostic.predictions.main_market.reason}
                          </p>
                        )}
                      </div>
                      {sportUI.showScoreExact && pronostic.predictions.score_exact && pronostic.predictions.score_exact !== 'N/A' && (
                        <div className="text-left sm:text-center">
                          <div className="text-2xl md:text-4xl font-bold text-white">
                            {pronostic.predictions.score_exact}
                          </div>
                          <span className="text-[10px] md:text-xs text-white/50">
                            {sport === 'mma' ? 'Méthode Prédite' : 'Score Prédit'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BTTS & Over 2.5 — football uniquement */}
                  {(sportUI.showBTTS || sportUI.showOverGoals) && (
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {sportUI.showBTTS && (
                        <div className="bg-white/[0.04] rounded-[14px] border border-white/[0.06] p-3 md:p-4 text-center">
                          <div className="text-xl md:text-2xl font-bold text-yellow-400">
                            {pronostic.predictions.btts_prob}%
                          </div>
                          <span className="text-[10px] md:text-xs text-white/60">Les deux équipes marquent</span>
                        </div>
                      )}
                      {sportUI.showOverGoals && (
                        <div className="bg-white/[0.04] rounded-[14px] border border-white/[0.06] p-3 md:p-4 text-center">
                          <div className="text-xl md:text-2xl font-bold text-blue-400">
                            {pronostic.predictions.over_2_5_prob}%
                          </div>
                          <span className="text-[10px] md:text-xs text-white/60">Plus de 2.5 buts</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Météo & Arbitre — masqués si N/A */}
                  {(pronostic.analysis.weather || pronostic.analysis.referee_tendency) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {pronostic.analysis.weather &&
                        pronostic.analysis.weather !== 'N/A - Match en salle' &&
                        pronostic.analysis.weather !== 'N/A - Combat en salle' && (
                        <div className="bg-white/[0.04] rounded-[14px] border border-white/[0.06] p-3 md:p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Cloud className="w-4 h-4 text-blue-400" />
                            <span className="text-xs md:text-sm font-medium text-white/70">Météo / Conditions</span>
                          </div>
                          <p className="text-xs md:text-sm text-white/80">{pronostic.analysis.weather}</p>
                        </div>
                      )}
                      {pronostic.analysis.referee_tendency &&
                        pronostic.analysis.referee_tendency !== 'N/A' &&
                        pronostic.analysis.referee_tendency !== 'N/A - Direction de course : historique penalties' && (
                        <div className="bg-white/[0.04] rounded-[14px] border border-white/[0.06] p-3 md:p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Gavel className="w-4 h-4 text-purple-400" />
                            <span className="text-xs md:text-sm font-medium text-white/70">Arbitre / Régulation</span>
                          </div>
                          <p className="text-xs md:text-sm text-white/80">{pronostic.analysis.referee_tendency}</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── STATS PRO ── */}
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  id="panel-stats"
                  role="tabpanel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4 md:space-y-6"
                >
                  <RadarStats
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    homeStats={pronostic.analysis.home_team_stats}
                    awayStats={pronostic.analysis.away_team_stats}
                  />
                  <H2HBar
                    history={pronostic.analysis.h2h_history}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                  />
                  <div className="bg-white/[0.04] rounded-[14px] border border-white/[0.06] p-4 md:p-5">
                    <h3 className="text-xs md:text-sm font-semibold text-white/70 mb-3 md:mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" style={{ color: sportConfig.color }} />
                      STATISTIQUES CLÉS
                    </h3>
                    <div className="space-y-2 md:space-y-3">
                      {pronostic.analysis.key_stats.map((stat, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 md:p-3 bg-white/[0.03] border border-white/[0.05] rounded-[10px] gap-2"
                        >
                          <span className="text-xs md:text-sm text-white/80 min-w-0 truncate">{stat.label}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-medium text-white text-xs md:text-sm">{stat.value}</span>
                            {stat.impact === 'positive' && <TrendingUp className="w-4 h-4 text-amber-400" />}
                            {stat.impact === 'negative' && <TrendingDown className="w-4 h-4 text-red-400" />}
                            {stat.impact === 'neutral' && <div className="w-4 h-4 rounded-full bg-gray-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {sportUI.showMissingPlayers && (
                    <div className="bg-white/[0.04] rounded-[14px] border border-white/[0.06] p-4 md:p-5">
                      <h3 className="text-xs md:text-sm font-semibold text-white/70 mb-3 md:mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-400" />
                        {sport === 'mma' ? 'COMBATTANTS' : 'JOUEURS ABSENTS'}
                      </h3>
                      {pronostic.analysis.missing_players.length > 0 ? (
                        <div className="space-y-2">
                          {pronostic.analysis.missing_players.map((player, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 md:p-3 bg-white/[0.03] border border-white/[0.05] rounded-[10px] gap-2"
                            >
                              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                <AlertTriangle
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    player.importance === 'High' || player.importance === 'Élevée'
                                      ? 'text-red-400'
                                      : player.importance === 'Medium' || player.importance === 'Moyenne'
                                      ? 'text-yellow-400'
                                      : 'text-gray-400'
                                  }`}
                                />
                                <div className="min-w-0">
                                  <span className="text-white font-medium text-xs md:text-sm truncate block">{player.player}</span>
                                  <span className="text-white/50 text-[10px] md:text-xs">({player.team})</span>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-1 text-[10px] md:text-xs rounded-full flex-shrink-0 ${
                                  player.importance === 'High' || player.importance === 'Élevée'
                                    ? 'bg-red-500/20 text-red-300'
                                    : player.importance === 'Medium' || player.importance === 'Moyenne'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-gray-500/20 text-gray-300'
                                }`}
                              >
                                {player.importance}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/50 text-xs md:text-sm">Aucune absence majeure signalée</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── TICKETS VIP ── */}
              {activeTab === 'tickets' && (
                <motion.div
                  key="tickets"
                  id="panel-tickets"
                  role="tabpanel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4 md:space-y-6"
                >
                  {(pronostic.vip_tickets?.fun?.ev_value != null && pronostic.vip_tickets.fun.ev_value > 0) && (
                    <EVGauge evValue={pronostic.vip_tickets.fun.ev_value} label="Valeur Espérée — Ticket VALUE" />
                  )}

                  {/* SAFE */}
                  <div className="rounded-xl p-4 md:p-6" style={{ background: `${sportConfig.color}18`, border: `2px solid ${sportConfig.color}55` }}>
                    <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 rounded-lg flex-shrink-0" style={{ background: `${sportConfig.color}25` }}>
                          <Shield className="w-5 h-5 md:w-6 md:h-6" style={{ color: sportConfig.color }} />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-bold" style={{ color: sportConfig.color }}>TICKET SAFE</h3>
                          <span className="text-[10px] md:text-xs text-white/50">Confiance élevée — Bankroll 5%</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1" style={{ color: sportConfig.color }}>
                          <Percent className="w-3 h-3 md:w-4 md:h-4" />
                          <span className="text-xl md:text-2xl font-bold">{pronostic.vip_tickets.safe.confidence}%</span>
                        </div>
                        <span className="text-[10px] md:text-xs text-white/50">Confiance</span>
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] p-3 md:p-4 mb-3 md:mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-xs md:text-sm">Marché</span>
                        <span className="text-white font-medium text-xs md:text-sm">{pronostic.vip_tickets.safe.market}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-xs md:text-sm">Sélection</span>
                        <span className="font-bold text-base md:text-lg" style={{ color: sportConfig.color }}>{pronostic.vip_tickets.safe.selection}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs md:text-sm">Cote estimée</span>
                        <span className="font-bold text-lg md:text-xl" style={{ color: sportConfig.color }}>{(pronostic.vip_tickets?.safe?.odds_estimated ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mb-3 md:mb-4">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5" style={{ color: sportConfig.color }} />
                      <p className="text-white/80 text-xs md:text-sm">{pronostic.vip_tickets?.safe?.reason || 'Analyse basée sur les statistiques et tendances actuelles.'}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 md:pt-4 border-t border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" style={{ color: sportConfig.color }} />
                        <span className="text-white/60 text-xs md:text-sm">{pronostic.vip_tickets.safe.bankroll_percent}% bankroll</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ShareButton match={match} pronostic={pronostic} ticketType="safe" />
                        <BetButton match={match} ticket={pronostic.vip_tickets.safe} ticketType="safe" confidence={pronostic.vip_tickets.safe.confidence} />
                      </div>
                    </div>
                  </div>

                  {/* FUN / VALUE */}
                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-2 border-purple-500/50 rounded-xl p-4 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                          <Zap className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-purple-400">TICKET VALUE</h3>
                          <span className="text-[10px] md:text-xs text-white/50">Value Bet — Bankroll 1-2%</span>
                        </div>
                      </div>
                      {(pronostic.vip_tickets?.fun?.ev_value != null && pronostic.vip_tickets.fun.ev_value > 0) && (
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-purple-400">
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-xl md:text-2xl font-bold">+{(pronostic.vip_tickets.fun.ev_value ?? 0).toFixed(1)}%</span>
                          </div>
                          <span className="text-[10px] md:text-xs text-white/50">Valeur Espérée</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-[10px] p-3 md:p-4 mb-3 md:mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-xs md:text-sm">Marché</span>
                        <span className="text-white font-medium text-xs md:text-sm">{pronostic.vip_tickets.fun.market}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 text-xs md:text-sm">Sélection</span>
                        <span className="text-purple-400 font-bold text-base md:text-lg">{pronostic.vip_tickets.fun.selection}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs md:text-sm">Cote estimée</span>
                        <span className="text-amber-400 font-bold text-lg md:text-xl">{(pronostic.vip_tickets?.fun?.odds_estimated ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mb-3 md:mb-4">
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-white/80 text-xs md:text-sm">{pronostic.vip_tickets.fun.risk_analysis}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 md:pt-4 border-t border-purple-500/30">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-purple-400" />
                        <span className="text-white/60 text-xs md:text-sm">{pronostic.vip_tickets.fun.bankroll_percent}% bankroll</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <ShareButton match={match} pronostic={pronostic} ticketType="fun" />
                        <BetButton match={match} ticket={pronostic.vip_tickets.fun} ticketType="fun" confidence={60} />
                      </div>
                    </div>
                  </div>

                  {/* Marchés complémentaires */}
                  {hasAdditionalMarkets && (
                    <div className="bg-white/[0.03] rounded-[14px] border border-white/[0.07] p-4 md:p-5">
                      <h3 className="text-xs md:text-sm font-semibold text-white/70 mb-3 md:mb-4 flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" style={{ color: sportConfig.color }} />
                        MARCHÉS COMPLÉMENTAIRES
                        <span
                          className="ml-auto px-2 py-0.5 rounded-full text-[10px]"
                          style={{ background: `${sportConfig.color}20`, color: sportConfig.color }}
                        >
                          {pronostic.additional_markets!.length} marchés
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                        {pronostic.additional_markets!.map((market: AdditionalMarket, i: number) => (
                          <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-[10px] p-3">
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <span className="text-white/60 text-[10px] md:text-xs leading-tight">{market.market}</span>
                              <span
                                className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium"
                                style={{
                                  background: market.confidence >= 72 ? 'rgba(34,197,94,0.15)' : market.confidence >= 55 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.08)',
                                  color: market.confidence >= 72 ? '#86efac' : market.confidence >= 55 ? '#fbbf24' : '#9ca3af'
                                }}
                              >
                                {market.confidence}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white font-semibold text-xs md:text-sm">{market.selection}</span>
                              <span className="text-amber-400 font-bold text-xs md:text-sm">@{market.odds_estimated.toFixed(2)}</span>
                            </div>
                            {market.reason && (
                              <p className="text-white/40 text-[10px] mt-1.5 leading-tight">{market.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="bg-amber-900/20 rounded-lg p-3 md:p-4 border border-amber-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-[10px] md:text-xs leading-relaxed">
                        <p className="text-amber-200/80">Les pronostics sont fournis à titre indicatif et ne constituent pas un conseil en investissement. Les performances passées ne garantissent pas les résultats futurs.</p>
                        <p className="text-amber-300/90 font-medium mt-1.5">Jouer comporte des risques : endettement, isolement, dépendance. Appelez le 09 74 75 13 13 (appel non surtaxé).</p>
                        <p className="text-amber-200/60 mt-1">Interdit aux moins de 18 ans. Ne misez jamais plus que ce que vous pouvez vous permettre de perdre.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ChatWidget match={match} pronostic={pronostic} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
