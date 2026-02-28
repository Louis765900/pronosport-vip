'use client';

import { motion } from 'framer-motion';

export function IntroStatement() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 text-center">
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white/90 max-w-4xl mx-auto leading-tight"
      >
        Plus de pronostics au hasard.{' '}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
          L&apos;IA fait le travail.
        </span>{' '}
        Vous récoltez les fruits.
      </motion.p>
    </section>
  );
}
