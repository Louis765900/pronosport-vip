'use client';

import { motion } from 'framer-motion';
import { Brain, Target, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Brain,
    title: "L'IA analyse",
    description:
      "Notre IA récupère en temps réel les stats, formes récentes, confrontations, blessures et cotes de marché pour chaque match.",
    accent: '#0A84FF',
  },
  {
    number: '02',
    icon: Target,
    title: 'Tu choisis',
    description:
      "Accède aux analyses détaillées avec taux de confiance, Expected Value et raisonnement complet. Tu gardes le contrôle.",
    accent: '#F59E0B',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Tu gagnes',
    description:
      "Suis ta bankroll en temps réel, analyse ton ROI et améliore ta stratégie avec notre historique transparent.",
    accent: '#30D158',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-5"
          >
            Comment ça marche
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
          >
            Simple. Efficace. Transparent.
          </motion.h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting line — desktop only */}
          <div
            className="absolute top-9 hidden md:block"
            style={{
              left: 'calc(16.66% + 2.5rem)',
              right: 'calc(16.66% + 2.5rem)',
              height: '1px',
              background: 'linear-gradient(to right, rgba(10,132,255,0.3), rgba(245,158,11,0.2), rgba(48,209,88,0.3))',
            }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative text-center"
            >
              {/* Icon circle */}
              <div
                className="relative w-18 h-18 mx-auto mb-6 flex items-center justify-center"
                style={{ width: '4.5rem', height: '4.5rem' }}
              >
                {/* Glow bg */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${step.accent}18 0%, transparent 70%)`,
                    border: `1px solid ${step.accent}30`,
                  }}
                />
                <step.icon className="w-7 h-7 relative z-10" style={{ color: step.accent }} />
                {/* Step number badge */}
                <span
                  className="absolute -top-2 -right-2 text-[10px] font-bold text-white/25"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
