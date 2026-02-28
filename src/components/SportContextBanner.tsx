'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { SportId } from '@/lib/config/sports'
import { getSportConfig } from '@/lib/config/sports'

interface SportContextInfo {
  markets: string
  source: string
  feature: string
}

const SPORT_CONTEXT: Record<SportId, SportContextInfo> = {
  football: {
    markets: '1N2 · Corners · Cartons · BTTS · Buteur',
    source: 'API-Football v3',
    feature: 'xG & arbitre disponibles',
  },
  basketball: {
    markets: 'Spread · Total · Quarts · Props',
    source: 'NBA.com + ESPN',
    feature: 'Injury Report temps réel',
  },
  nba: {
    markets: 'Spread · Total · Props · Parlay',
    source: 'NBA.com Officiel',
    feature: 'Injury Report officiel',
  },
  f1: {
    markets: 'Vainqueur · Podium · Safety Car · Fastest Lap',
    source: 'Formula1.com',
    feature: 'Qualifs + Météo circuit',
  },
  mma: {
    markets: 'Vainqueur · Méthode · Round · Combo',
    source: 'UFC.com + Tapology',
    feature: 'Stats grappling & frappes',
  },
  hockey: {
    markets: 'Puck Line · Total · Power Play',
    source: 'NHL.com',
    feature: 'Stats gardien et PP%',
  },
  baseball: {
    markets: 'Run Line · Total · Strikeouts',
    source: 'MLB.com',
    feature: 'Stats ERA lanceur partant',
  },
  rugby: {
    markets: 'Essais · Handicap · HT/FT',
    source: 'Rugby Union Officiel',
    feature: 'Stats et pénalités',
  },
  nfl: {
    markets: 'Spread · TD scorer · QB yards',
    source: 'NFL.com',
    feature: 'Advanced stats disponibles',
  },
  handball: {
    markets: 'Total buts · 7m · HT/FT',
    source: 'EHF Officiel',
    feature: 'Stats gardien incluses',
  },
  volleyball: {
    markets: 'Sets · Tie-break · Aces',
    source: 'CEV Officiel',
    feature: 'Stats services & réception',
  },
  afl: {
    markets: 'Handicap · Goals · Disposals',
    source: 'AFL Officiel',
    feature: 'Stats quarts de match',
  },
}

function InfoChip({ children, icon }: { children: string; icon: string }) {
  return (
    <span
      className="flex items-center gap-1 text-[10px] text-white/40 px-2 py-0.5 rounded-pill"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </span>
  )
}

export function SportContextBanner({ sport }: { sport: SportId }) {
  const config = getSportConfig(sport)
  const ctx = SPORT_CONTEXT[sport]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sport}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4 rounded-macos overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${config.color}12 0%, ${config.color}06 100%)`,
          border: `1px solid ${config.color}20`,
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Sport emoji with glow halo */}
          <div
            className="text-xl w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
            style={{
              background: `${config.color}18`,
              boxShadow: `0 0 14px ${config.color}28`,
            }}
          >
            {config.emoji}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Sport label + markets chip */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: config.color }}
              >
                {config.label}
              </span>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-pill"
                style={{
                  background: `${config.color}14`,
                  color: `${config.color}cc`,
                }}
              >
                {ctx.markets}
              </span>
            </div>

            {/* Source + feature chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <InfoChip icon="📡">{ctx.source}</InfoChip>
              <InfoChip icon="✨">{ctx.feature}</InfoChip>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
