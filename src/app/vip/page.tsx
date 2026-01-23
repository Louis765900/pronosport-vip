// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Trophy,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  Star,
  Users,
  Target,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronRight,
  BarChart3,
  Clock,
  Gift,
  Medal,
  Flame,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Composant pour les particules dorées flottantes
const GoldParticles = () => {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 10,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-20, 20, -20],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Carte de ticket gagnant
const WinningTicketCard = ({ match, bet, odds, result, profit, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 40, rotateX: -15 }}
    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ scale: 1.03, y: -5 }}
    className="relative group"
  >
    <div className="absolute -inset-1 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-green-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-green-500/30 overflow-hidden">
      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
        <CheckCircle2 className="w-3 h-3 text-green-400" />
        <span className="text-xs text-green-400 font-semibold">GAGNÉ</span>
      </div>

      <div className="p-5">
        <p className="text-gray-400 text-xs mb-1">VIP PICK</p>
        <h4 className="text-white font-bold text-lg mb-3">{match}</h4>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pari</span>
            <span className="text-white font-medium">{bet}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cote</span>
            <span className="text-yellow-400 font-bold">{odds}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Résultat</span>
            <span className="text-white">{result}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Profit</span>
            <span className="text-green-400 font-bold text-xl">+{profit}%</span>
          </div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" />
    </div>
  </motion.div>
);

// Stats animées
const AnimatedStat = ({ value, label, icon: Icon, delay }: any) => {
  const [count, setCount] = useState(0);
  const numValue = parseInt(value.replace(/[^0-9]/g, ''));

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numValue]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 mb-3">
        <Icon className="w-7 h-7 text-yellow-400" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        {count}{value.includes('%') ? '%' : value.includes('+') ? '+' : ''}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
    </motion.div>
  );
};

// Feature component
function Feature({ icon, title, desc }: any) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 bg-gray-800/50 p-3 rounded-xl h-fit border border-white/5">{icon}</div>
      <div>
        <h4 className="text-lg font-bold text-white">{title}</h4>
        <p className="text-gray-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}

export default function VIPPage() {
  const [isHovered, setIsHovered] = useState(false);

  const winningTickets = [
    { match: "PSG vs Man City", bet: "Over 2.5 Goals", odds: "1.85", result: "3-1", profit: "85" },
    { match: "Real Madrid vs Bayern", bet: "BTTS - Oui", odds: "1.72", result: "2-2", profit: "72" },
    { match: "Liverpool vs Arsenal", bet: "1X + Over 1.5", odds: "2.10", result: "2-1", profit: "110" },
  ];

  const features = [
    { icon: Target, text: "1 Pick VIP Ultra-Confiant par jour" },
    { icon: BarChart3, text: "Analyse IA + Données temps réel" },
    { icon: Zap, text: "Alertes Telegram instantanées" },
    { icon: Shield, text: "Gestion de bankroll incluse" },
    { icon: Users, text: "Communauté privée Discord" },
    { icon: Gift, text: "Bonus: Accès aux cotes boostées" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 215, 0, 0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255, 215, 0, 0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-yellow-500/10 via-transparent to-transparent" />
        <GoldParticles />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-gray-900" />
            </div>
            <span className="font-bold text-xl">
              Pronosport<span className="text-yellow-400">VIP</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Connexion</span>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 md:pt-20 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-6"
          >
            <Flame className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">78% de réussite sur les 30 derniers jours</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
          >
            Arrêtez de{' '}
            <span className="text-gray-500 line-through">Parier</span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Investissez.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Rejoignez l'élite des parieurs. Notre IA analyse des milliers de données
            pour vous fournir <span className="text-white font-semibold">1 pick ultra-confiant</span> chaque jour.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/login"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold text-lg rounded-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-yellow-500/30"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                animate={{ x: isHovered ? '200%' : '-100%' }}
                transition={{ duration: 0.6 }}
              />
              <Crown className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Devenir VIP Maintenant</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
            >
              Voir les offres
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span>Accès instantané</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>+2,500 membres</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedStat value="78%" label="Taux de réussite" icon={Target} delay={0} />
            <AnimatedStat value="2500+" label="Membres actifs" icon={Users} delay={0.1} />
            <AnimatedStat value="156" label="Picks gagnants (2024)" icon={Trophy} delay={0.2} />
            <AnimatedStat value="12" label="Mois d'expertise" icon={Medal} delay={0.3} />
          </div>
        </div>
      </section>

      {/* PREUVES - TICKETS GAGNANTS */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Résultats récents
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nos <span className="text-green-400">Derniers Gains</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Transparence totale. Voici nos derniers picks VIP validés.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {winningTickets.map((ticket, index) => (
              <WinningTicketCard key={index} {...ticket} delay={index * 0.15} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - POURQUOI VIP */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-white"
              >
                Pourquoi le <span className="text-yellow-400">VIP</span> change la donne ?
              </motion.h2>
              <div className="space-y-6">
                <Feature
                  icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
                  title="Confiance Safe & Ultra Safe"
                  desc="Fini les paris au hasard. On ne joue que ce qui est mathématiquement avantageux."
                />
                <Feature
                  icon={<TrendingUp className="w-6 h-6 text-blue-400" />}
                  title="Gestion de Bankroll Intégrée"
                  desc="Nous vous disons exactement combien miser (1%, 2%, 5%) pour sécuriser vos gains."
                />
                <Feature
                  icon={<Crown className="w-6 h-6 text-yellow-400" />}
                  title="Analyses IA + Perplexity"
                  desc="Nos algos croisent des milliers de données en temps réel (Blessures, Météo, Enjeux)."
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gray-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm relative"
            >
              <div className="absolute -top-4 -right-4 bg-green-500 text-black font-bold px-4 py-1 rounded-full text-sm animate-pulse">
                LIVE
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Performance Historique</h3>
              <div className="text-5xl font-bold text-green-400 mb-2">~78%</div>
              <p className="text-gray-400 text-sm">Taux de réussite moyen sur les pronostics "Safe" (Cote 1.50+)</p>
              <div className="mt-6 h-3 w-full bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '78%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">156</div>
                  <div className="text-xs text-gray-500">Gagnés</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">44</div>
                  <div className="text-xs text-gray-500">Perdus</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">+312%</div>
                  <div className="text-xs text-gray-500">ROI Total</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CE QUE VOUS OBTENEZ */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ce que vous <span className="text-yellow-400">obtenez</span>
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-yellow-500/30 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-white font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choisissez votre <span className="text-yellow-400">Accès</span>
            </h2>
            <p className="text-gray-400">Investissement unique. Résultats garantis.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Plan Mensuel */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold mb-2">Mensuel</h3>
              <p className="text-gray-400 text-sm mb-4">Parfait pour découvrir</p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">29€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <ul className="space-y-3 mb-6">
                {["1 Pick VIP/jour", "Alertes Telegram", "Support 7j/7"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-colors">
                Commencer
              </button>
            </motion.div>

            {/* Plan Annuel - RECOMMANDÉ */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/50 via-amber-500/50 to-yellow-500/50 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl rounded-2xl border border-yellow-500/50 p-6 overflow-hidden">
                <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 text-xs font-bold rounded-bl-xl">
                  POPULAIRE
                </div>

                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  Annuel
                </h3>
                <p className="text-gray-400 text-sm mb-4">Économisez 40%</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">199€</span>
                  <span className="text-gray-400">/an</span>
                  <span className="ml-2 text-sm text-gray-500 line-through">348€</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {["Tout le plan mensuel", "Discord privé", "Lives hebdo", "Bonus: Formation Bankroll"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-gray-900 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Rejoindre l'élite
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à rejoindre les <span className="text-yellow-400">gagnants</span> ?
            </h2>
            <p className="text-gray-400 mb-8">
              Ne laissez plus le hasard décider. Faites confiance à l'IA.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-yellow-500/30 transition-all"
            >
              <Crown className="w-5 h-5" />
              Commencer maintenant
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2025 Pronosport VIP. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Conditions</a>
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
