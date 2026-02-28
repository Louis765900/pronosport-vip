'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Clock, MapPin, Search, Brain, BarChart3, Flame, Star, Shield, Zap, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { Match, getTeamColor, getTeamInitials, LEAGUE_COLORS, VIPTickets } from '@/types'
import { getSportConfig } from '@/lib/config/sports'

interface MatchCardProps {
  match: Match
  onGeneratePronostic: (match: Match) => void
  isLoading: boolean
  badges?: {
    isValue?: boolean
    isSafe?: boolean
  }
  isFavorite?: boolean
  onToggleFavorite?: (matchId: string) => void
  ticketData?: VIPTickets
  ticketViewMode?: boolean
}

const loadingMessages = [
  { icon: Search,    text: 'Recherche des données…' },
  { icon: BarChart3, text: 'Analyse statistique…' },
  { icon: Brain,     text: 'Génération VIP…' },
]

function TeamLogo({ teamName, logoUrl }: { teamName: string; logoUrl?: string }) {
  const [imgError, setImgError] = useState(false)
  const initials = getTeamInitials(teamName)
  const color = getTeamColor(teamName)

  if (logoUrl && !imgError) {
    return (
      <Image
        src={logoUrl}
        alt={teamName}
        width={44}
        height={44}
        className="w-full h-full object-contain"
        onError={() => setImgError(true)}
        unoptimized
      />
    )
  }

  return (
    <div
      className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-xs"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

export default function MatchCard({
  match,
  onGeneratePronostic,
  isLoading,
  badges,
  isFavorite = false,
  onToggleFavorite,
  ticketData,
  ticketViewMode = false,
}: MatchCardProps) {
  const [loadingStep, setLoadingStep] = useState(0)
  const [tapped, setTapped] = useState(false)
  const sportConfig = getSportConfig(match.sport ?? 'football')
  const leagueColor = LEAGUE_COLORS[match.league] || sportConfig.color

  useEffect(() => {
    if (!isLoading) { setLoadingStep(0); return }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isLoading])

  const { icon: LoadingIcon, text: loadingText } = loadingMessages[loadingStep]
  const hasScore = match.homeScore !== undefined && match.homeScore !== null
  const showTicketPreview = ticketViewMode && !!ticketData

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.013, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } }}
      whileTap={{ scale: 0.984, transition: { duration: 0.08 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onTapStart={() => setTapped(true)}
      onTap={() => setTimeout(() => setTapped(false), 160)}
      onTapCancel={() => setTapped(false)}
      className="ios-widget overflow-hidden relative group cursor-pointer transition-shadow duration-300"
      style={{ '--sport-glow': sportConfig.color } as React.CSSProperties}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 22px ${sportConfig.color}20`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = ''
      }}
    >
      {/* Haptic tap flash */}
      <AnimatePresence>
        {tapped && (
          <motion.div
            initial={{ opacity: 0.18 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-white rounded-ios pointer-events-none z-30"
          />
        )}
      </AnimatePresence>

      {/* Subtle loading ring */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 rounded-ios pointer-events-none z-20"
          style={{ boxShadow: '0 0 0 1.5px rgba(245,158,11,0.45) inset' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* ── TOP BAR: League + Meta ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: leagueColor, boxShadow: `0 0 5px ${leagueColor}55` }}
          />
          <span className="text-[10px] font-medium text-white/45 truncate tracking-wider uppercase">
            {match.league}
          </span>
        </div>

        {/* Sport badge */}
        <span
          className="text-[10px] opacity-50 flex-shrink-0"
          title={sportConfig.label}
        >
          {sportConfig.emoji}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Badges */}
          <AnimatePresence>
            {badges?.isValue && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-pill text-[9px] font-bold"
                style={{
                  background: 'rgba(255,159,10,0.15)',
                  border: '1px solid rgba(255,159,10,0.28)',
                  color: '#FF9F0A',
                }}
              >
                <Flame className="w-2 h-2" />
                VALUE
              </motion.div>
            )}
            {badges?.isSafe && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-pill text-[9px] font-bold"
                style={{
                  background: 'rgba(10,132,255,0.12)',
                  border: '1px solid rgba(10,132,255,0.25)',
                  color: '#0A84FF',
                }}
              >
                <Shield className="w-2 h-2" />
                SAFE
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-pill bg-white/[0.05] border border-white/[0.07]">
            <Clock className="w-2.5 h-2.5 text-white/35" />
            <span className="text-[10px] font-medium text-white/60">{match.time}</span>
          </div>

          {/* Favorite */}
          {onToggleFavorite && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={e => { e.stopPropagation(); onToggleFavorite(match.id) }}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/[0.07] transition-colors"
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className={`w-3 h-3 transition-colors ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-white/25'}`} />
            </motion.button>
          )}
        </div>
      </div>

      {/* ── SEPARATOR ───────────────────────────────────────────── */}
      <div className="mx-4 h-px bg-white/[0.04]" />

      {/* ── TEAMS ───────────────────────────────────────────────── */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">

          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center p-1.5 overflow-hidden">
              <TeamLogo teamName={match.homeTeam} logoUrl={match.homeTeamLogo} />
            </div>
            <span className="text-[12px] font-semibold text-white/85 text-center leading-tight px-1 truncate w-full">
              {match.homeTeam}
            </span>
          </div>

          {/* VS / Score */}
          <div className="px-3 flex-shrink-0 flex flex-col items-center gap-0.5">
            {hasScore ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white tabular-nums">
                    {match.homeScore ?? 0}
                  </span>
                  <span className="text-xs font-light text-white/20">–</span>
                  <span className="text-2xl font-black text-white tabular-nums">
                    {match.awayScore ?? 0}
                  </span>
                </div>
                <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-pill ${
                  match.isFinished
                    ? 'bg-white/[0.06] text-white/35'
                    : 'bg-apple-green/[0.12] text-apple-green animate-pulse'
                }`}>
                  {match.isFinished ? 'Terminé' : 'Live'}
                </span>
              </>
            ) : (
              <>
                <span className="text-[14px] font-light text-white/18 tracking-widest">VS</span>
                <span className="text-[9px] text-white/25 mt-0.5">{match.date}</span>
              </>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center p-1.5 overflow-hidden">
              <TeamLogo teamName={match.awayTeam} logoUrl={match.awayTeamLogo} />
            </div>
            <span className="text-[12px] font-semibold text-white/85 text-center leading-tight px-1 truncate w-full">
              {match.awayTeam}
            </span>
          </div>

        </div>
      </div>

      {/* ── VENUE ───────────────────────────────────────────────── */}
      {match.stade && (
        <div className="mx-4 flex items-center justify-center gap-1 text-white/25 text-[10px] mb-2.5 -mt-1">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{match.stade}</span>
        </div>
      )}

      {/* ── TICKET PREVIEW ──────────────────────────────────────── */}
      <AnimatePresence>
        {showTicketPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-4 mb-3 overflow-hidden"
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* SAFE row */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(10,132,255,0.12)', color: '#0A84FF' }}
                >
                  <Shield className="w-2.5 h-2.5" />
                  SAFE
                </div>
                <span className="text-[11px] text-white/55 flex-1 truncate">
                  {ticketData.safe.selection}
                </span>
                <span className="text-[11px] font-semibold text-amber-400 flex-shrink-0">
                  @{ticketData.safe.odds_estimated}
                </span>
                <span className="text-[11px] text-white/35 flex-shrink-0 tabular-nums">
                  {ticketData.safe.confidence}%
                </span>
              </div>

              {/* Divider */}
              <div className="mx-3 h-px bg-white/[0.05]" />

              {/* FUN row */}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0"
                  style={{ background: 'rgba(175,82,222,0.12)', color: '#BF5AF2' }}
                >
                  <Zap className="w-2.5 h-2.5" />
                  FUN
                </div>
                <span className="text-[11px] text-white/55 flex-1 truncate">
                  {ticketData.fun.selection}
                </span>
                <span className="text-[11px] font-semibold text-amber-400 flex-shrink-0">
                  @{ticketData.fun.odds_estimated}
                </span>
                {ticketData.fun.ev_value != null && (
                  <span className="text-[11px] font-semibold text-[#30D158] flex-shrink-0 tabular-nums">
                    +{ticketData.fun.ev_value}%
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ANALYSE BUTTON ──────────────────────────────────────── */}
      {!match.isFinished && (
        <div className="px-4 pb-4">
          <motion.button
            whileHover={{ scale: isLoading ? 1 : 1.015 }}
            whileTap={{ scale: isLoading ? 1 : 0.985 }}
            onClick={() => onGeneratePronostic(match)}
            disabled={isLoading}
            className={`
              w-full py-2.5 px-4 rounded-macos font-medium text-[13px]
              flex items-center justify-center gap-2
              min-h-[42px] transition-all duration-200
              ${isLoading
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400/70 cursor-not-allowed'
                : showTicketPreview
                  ? 'text-white/40 hover:text-white/60 transition-colors'
                  : 'btn-gold cursor-pointer'
              }
            `}
            style={showTicketPreview && !isLoading ? {
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            } : {}}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key={loadingStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <LoadingIcon className="w-3.5 h-3.5" />
                  </motion.div>
                  <span>{loadingText}</span>
                </motion.div>
              ) : showTicketPreview ? (
                <motion.div
                  key="refresh"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span className="text-[12px]">Actualiser l&apos;analyse</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyse PronoScope</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
