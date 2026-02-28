'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Trophy } from 'lucide-react';
import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="relative py-40 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-white/[0.06]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-black to-amber-900/10" />
      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-amber-500/[0.07] rounded-full blur-[120px]" />

      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
            Prêt à parier{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
              plus intelligemment
            </span>{' '}
            ?
          </h2>

          <p className="text-xl text-white/45 mb-12 max-w-xl mx-auto">
            Rejoignez gratuitement. Aucune carte requise. Commencez en 30 secondes.
          </p>

          <Link
            href="/join"
            className="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-2xl shadow-amber-500/25 active:scale-[0.97]"
          >
            <Trophy className="w-6 h-6" />
            Créer mon compte gratuit
            <ArrowRight className="w-6 h-6" />
          </Link>

          <p className="text-xs text-white/25 mt-6">
            Gratuit pour toujours · Jeu responsable · 18+
          </p>
        </motion.div>
      </div>
    </section>
  );
}
