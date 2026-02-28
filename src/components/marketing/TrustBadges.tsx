'use client';

import { motion } from 'framer-motion';
import { Brain, BarChart3, CheckCircle2, TrendingUp, Target } from 'lucide-react';

const features = [
  {
    label: 'Intelligence Artificielle',
    title: "Des analyses que vous ne trouvez nulle part ailleurs.",
    description:
      "Perplexity AI et Gemini analysent des dizaines de sources en temps réel — statistiques, blessures, météo, enjeux — pour vous livrer une analyse complète en quelques secondes.",
    accent: '#F59E0B',
    stats: [
      { value: '57.9%', label: 'Taux de réussite' },
      { value: '+12.4%', label: 'ROI moyen' },
    ],
    align: 'left' as const,
    mockCard: (
      <div className="ios-widget rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 font-medium">Analyse IA · Ligue 1</span>
          <span className="text-xs font-bold text-[#30D158] bg-[#30D158]/10 border border-[#30D158]/20 px-2 py-0.5 rounded-full">GAGNÉ</span>
        </div>
        <div>
          <p className="font-semibold text-white text-sm mb-0.5">PSG vs Monaco</p>
          <p className="text-xs text-white/35">Plus de 2.5 buts · @1.75</p>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/40">Confiance IA</span>
            <span className="text-amber-400 font-bold">78%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full w-[78%] bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
          {[
            { label: 'xG Domicile', value: '2.1' },
            { label: 'xG Extérieur', value: '0.9' },
          ].map((d) => (
            <div key={d.label} className="text-center">
              <p className="text-base font-bold text-white">{d.value}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Bankroll Manager',
    title: "Gérez vos paris comme un professionnel.",
    description:
      "Suivez votre capital pari, votre ROI dans le temps et visualisez vos performances avec des graphiques clairs. Zéro tableur, tout est automatique.",
    accent: '#0A84FF',
    stats: [
      { value: '500+', label: 'Membres actifs' },
      { value: '250+', label: 'Analyses publiées' },
    ],
    align: 'right' as const,
    mockCard: (
      <div className="ios-widget rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40 font-medium">Bankroll Evolution</span>
          <span className="text-xs font-bold text-[#30D158]">+12.4%</span>
        </div>
        {/* Mini bar chart */}
        <div className="flex items-end gap-1.5 h-20">
          {[40, 55, 48, 62, 70, 58, 80, 72, 88, 95].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${h}%`,
                background: i === 9
                  ? 'linear-gradient(to top, #0A84FF, #34C7FF)'
                  : 'rgba(255,255,255,0.07)',
              }}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
          {[
            { label: 'Initial', value: '100€' },
            { label: 'Actuel', value: '112€' },
            { label: 'ROI', value: '+12%' },
          ].map((d) => (
            <div key={d.label} className="text-center">
              <p className="text-sm font-bold text-white">{d.value}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{d.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#30D158] bg-[#30D158]/8 rounded-xl px-3 py-2">
          <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Progression sur 3 mois</span>
        </div>
      </div>
    ),
  },
];

export function TrustSection() {
  return (
    <div>
      {features.map((feature, i) => (
        <section
          key={feature.label}
          className={`py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06] ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}
        >
          <div className="max-w-5xl mx-auto">
            <div
              className={`flex flex-col ${feature.align === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-14 lg:gap-20`}
            >
              {/* Text side */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-1"
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: feature.accent }}
                >
                  {feature.label}
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-5 leading-tight">
                  {feature.title}
                </h2>
                <p className="text-white/50 leading-relaxed text-lg mb-8">
                  {feature.description}
                </p>

                {/* Mini stats */}
                <div className="flex gap-8 mb-8">
                  {feature.stats.map((s) => (
                    <div key={s.label}>
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-white/35 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Feature bullets */}
                <div className="space-y-2">
                  {[
                    '100% gratuit, aucun abonnement',
                    'Analyses temps réel 24/7',
                    'Transparence totale sur les résultats',
                  ].map((bullet) => (
                    <div key={bullet} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: feature.accent }} />
                      <span className="text-sm text-white/50">{bullet}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Visual side */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-1 max-w-sm w-full"
              >
                {feature.mockCard}
              </motion.div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
