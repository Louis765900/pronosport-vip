'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const recentResults = [
  {
    match: 'PSG vs Monaco',
    competition: 'Ligue 1',
    pick: 'Plus de 2.5 buts',
    odds: 1.75,
    result: 'win',
    score: '3-1',
    date: '28 Jan 2026',
    confidence: 78,
  },
  {
    match: 'Liverpool vs Arsenal',
    competition: 'Premier League',
    pick: 'BTTS Oui',
    odds: 1.85,
    result: 'win',
    score: '2-2',
    date: '27 Jan 2026',
    confidence: 72,
  },
  {
    match: 'Real Madrid vs Atletico',
    competition: 'La Liga',
    pick: 'Moins de 3.5 buts',
    odds: 1.65,
    result: 'loss',
    score: '4-2',
    date: '26 Jan 2026',
    confidence: 65,
  },
  {
    match: 'Bayern vs Dortmund',
    competition: 'Bundesliga',
    pick: 'Bayern gagne',
    odds: 1.55,
    result: 'win',
    score: '2-0',
    date: '25 Jan 2026',
    confidence: 82,
  },
];

export function RecentResults() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] bg-white/[0.015]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-[#30D158] mb-5"
          >
            Track Record
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4"
          >
            Transparence totale.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/45 max-w-xl mx-auto"
          >
            Voici nos dernières analyses avec leurs résultats réels.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentResults.map((result, index) => (
            <motion.div
              key={result.match}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="ios-widget p-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/35">{result.date}</span>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
                    result.result === 'win'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {result.result === 'win' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {result.result === 'win' ? 'GAGNÉ' : 'PERDU'}
                </div>
              </div>

              {/* Match */}
              <h3 className="font-semibold text-white mb-1">{result.match}</h3>
              <p className="text-xs text-white/35 mb-3">{result.competition}</p>

              {/* Pick */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Pick</span>
                  <span className="text-sm text-white">{result.pick}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Cote</span>
                  <span className="text-sm font-bold text-amber-400">@{result.odds}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">Score</span>
                  <span className="text-sm text-white">{result.score}</span>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/35">Confiance IA</span>
                  <span className="text-white/60">{result.confidence}%</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      result.result === 'win' ? 'bg-green-500' : 'bg-red-500'
                    )}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/pronostics"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] text-white/70 hover:text-white font-medium border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
          >
            Voir tout l&apos;historique
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
