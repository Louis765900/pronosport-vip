// @ts-nocheck
"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  AlertCircle,
  CheckCircle2,
  Trophy,
  X,
  Send,
  AlertTriangle,
  Phone,
  LogIn,
  TrendingUp,
  Users,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const brandStats = [
  { icon: Target, value: '57.9%', label: 'Taux de réussite' },
  { icon: TrendingUp, value: '+12.4%', label: 'ROI moyen' },
  { icon: Users, value: '500+', label: 'Membres actifs' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setError(data.error || 'Identifiants incorrects');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      const redirectTo = data.redirect || '/';
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1500);

    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setError('Erreur de connexion au serveur');
      setIsLoading(false);
    }
  };

  const shakeAnimation = {
    x: shake ? [0, -10, 10, -10, 10, 0] : 0,
    transition: { duration: 0.5 }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setForgotLoading(false);
    setForgotSent(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setTimeout(() => {
      setForgotEmail('');
      setForgotSent(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex bg-black">

      {/* ── Panneau gauche – Branding (desktop uniquement) ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/15 via-black to-[#0A1628]/30" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold text-white">
            Prono<span className="text-amber-400">Scope</span>
          </span>
        </div>

        {/* Contenu central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              L'avantage de l'IA{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-300">
                pour vos paris.
              </span>
            </h1>
            <p className="text-white/50 text-lg mb-10">
              Rejoignez 500+ membres qui parient avec intelligence.
            </p>

            {/* Stats pills */}
            <div className="space-y-3 mb-10">
              {brandStats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <s.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-white font-bold">{s.value}</span>
                    <span className="text-white/40 text-sm ml-2">{s.label}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mock analysis card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="ios-widget rounded-2xl p-4 max-w-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/40">Analyse IA</span>
                <span className="text-xs bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/20 px-2 py-0.5 rounded-full font-semibold">GAGNÉ</span>
              </div>
              <p className="text-sm font-semibold text-white mb-1">PSG vs Monaco</p>
              <p className="text-xs text-white/40 mb-3">Ligue 1 · 28 Jan 2026</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Confiance IA</span>
                <span className="text-amber-400 font-bold">78%</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-[78%] bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Legal bottom */}
        <div className="relative z-10">
          <p className="text-white/25 text-xs">
            Les performances passées ne garantissent pas les résultats futurs.
          </p>
        </div>
      </div>

      {/* ── Panneau droit – Formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 bg-[#080808]" />

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex lg:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-black" />
          </div>
          <span className="text-base font-bold text-white">
            Prono<span className="text-amber-400">Scope</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative w-full max-w-sm"
        >
          <motion.div animate={shakeAnimation}
          >
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">Bon retour</h2>
              <p className="text-white/40 text-sm">Connectez-vous à votre espace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[13px] text-white/50 font-medium">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-400 transition-colors" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@email.com"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3 pl-10 pr-4 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                    required
                    disabled={isLoading || success}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <label className="text-[13px] text-white/50 font-medium">Mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-400 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3 pl-10 pr-10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                    required
                    disabled={isLoading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    disabled={isLoading || success}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Erreur */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-400 text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Succès */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="flex items-center gap-2 p-3 bg-[#30D158]/10 border border-[#30D158]/20 rounded-xl overflow-hidden"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#30D158] flex-shrink-0" />
                    <span className="text-[#30D158] text-sm">Connexion réussie ! Redirection...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={isLoading || success || !email || !password}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed text-black disabled:text-white/30 font-bold py-3.5 rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:shadow-none mt-1"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Bienvenue !
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            {/* Séparateur */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-white/30">ou continuer avec</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Google */}
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.09] rounded-2xl text-white/80 text-sm font-medium transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </a>

            {/* Liens */}
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="block w-full text-center text-white/30 text-sm hover:text-white/60 transition-colors"
              >
                Mot de passe oublié ?
              </button>
              <p className="text-center text-white/30 text-sm">
                Pas encore membre ?{' '}
                <Link href="/join" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                  Créer un compte
                </Link>
              </p>
            </div>

            {/* Avertissement 18+ */}
            <div className="mt-6 p-3 bg-amber-900/15 border border-amber-500/15 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-200/60 leading-relaxed">
                  <p className="font-semibold mb-0.5">
                    <span className="text-red-400 font-bold">18+</span> · Jouer comporte des risques : endettement, dépendance.
                  </p>
                  <a href="tel:0974751313" className="flex items-center gap-1 text-amber-300 hover:text-amber-200">
                    <Phone className="w-3 h-3" />
                    09 74 75 13 13 (appel non surtaxé)
                  </a>
                </div>
              </div>
            </div>

            {/* Sécurité */}
            <div className="flex items-center justify-center gap-4 mt-5 text-xs text-white/20">
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#30D158]/50" />
                <span>SSL Sécurisé</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-500/50" />
                <span>Données chiffrées</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Modale Mot de passe oublié ── */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeForgotModal}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm"
            >
              <div className="relative bg-[#111] backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                <div className="p-6">
                  <button
                    onClick={closeForgotModal}
                    className="absolute top-4 right-4 p-1.5 text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Mot de passe oublié</h3>
                    <p className="text-white/40 text-sm">Entrez votre email pour recevoir un lien.</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {!forgotSent ? (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleForgotPassword}
                        className="space-y-3"
                      >
                        <div className="relative group">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-400 transition-colors" />
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="votre@email.com"
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3 pl-10 pr-4 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                            required
                            disabled={forgotLoading}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={forgotLoading || !forgotEmail}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {forgotLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Envoyer le lien
                            </>
                          )}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-4"
                      >
                        <div className="w-14 h-14 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle2 className="w-7 h-7 text-[#30D158]" />
                        </div>
                        <h4 className="text-base font-semibold text-white mb-1">Lien envoyé !</h4>
                        <p className="text-white/40 text-sm mb-4">Vérifiez votre boîte mail.</p>
                        <button
                          onClick={closeForgotModal}
                          className="px-6 py-2 bg-white/[0.06] hover:bg-white/[0.10] text-white rounded-xl transition-colors text-sm"
                        >
                          Fermer
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
