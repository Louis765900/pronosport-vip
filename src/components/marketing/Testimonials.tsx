'use client';

import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

const testimonials = [
  {
    name: 'Thomas M.',
    role: 'Parieur depuis 6 mois',
    content: 'Les analyses sont vraiment pertinentes. Le taux de réussite est impressionnant et surtout, c\'est 100% gratuit !',
    rating: 5,
  },
  {
    name: 'Sophie L.',
    role: 'Membre depuis 4 mois',
    content: 'J\'ai enfin trouvé une plateforme transparente qui ne cherche pas à me vendre des abonnements. Le système de bankroll m\'a beaucoup aidée.',
    rating: 5,
  },
  {
    name: 'Alexandre D.',
    role: 'Parieur expérimenté',
    content: 'L\'approche basée sur les données et l\'IA est rafraîchissante. Fini les pronostics au hasard, ici c\'est du sérieux.',
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn('w-3.5 h-3.5', i < rating ? 'text-amber-400 fill-amber-400' : 'text-white/10')}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-5"
          >
            Ce que disent nos membres
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
          >
            Ils parient plus intelligemment.
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card-premium rounded-2xl p-6 relative transition-all duration-300"
            >
              <Quote className="absolute top-5 right-5 w-7 h-7 text-white/[0.04]" />

              <div className="mb-4">
                <StarRating rating={testimonial.rating} />
              </div>

              <p className="text-white/65 text-sm leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                  <p className="text-xs text-white/35">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
