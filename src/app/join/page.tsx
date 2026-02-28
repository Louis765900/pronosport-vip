"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Trophy,
  Sparkles,
  TrendingUp,
  BarChart3,
  Users,
  Check,
} from "lucide-react";
import Link from "next/link";

const features = [
  { icon: Sparkles, text: "Analyses IA quotidiennes" },
  { icon: BarChart3, text: "Bankroll tracker intégré" },
  { icon: Users, text: "Communauté de 500+ membres" },
  { icon: TrendingUp, text: "+12.4% ROI moyen constaté" },
];

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdult) {
      setError("Vous devez certifier avoir plus de 18 ans pour continuer.");
      return;
    }
    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, token: token || null }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2500);
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
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
              Votre premier pari{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-300">
                intelligent
              </span>{" "}
              commence ici.
            </h1>
            <p className="text-white/50 text-lg mb-10">
              100% gratuit · Analyses IA · Jeu responsable
            </p>

            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-white/70 text-sm">{f.text}</span>
                </motion.div>
              ))}
            </div>
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
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-1">Créer votre compte</h2>
                  <p className="text-white/40 text-sm">Rejoignez PronoScope gratuitement.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-white/50 font-medium">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-400 transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3 pl-10 pr-4 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                        placeholder="vous@email.com"
                      />
                    </div>
                  </div>

                  {/* Mot de passe */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-white/50 font-medium">Mot de passe</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-400 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3 pl-10 pr-10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                        placeholder="Minimum 8 caractères"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmer mot de passe */}
                  <div className="space-y-1.5">
                    <label className="text-[13px] text-white/50 font-medium">Confirmer le mot de passe</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-amber-400 transition-colors" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3 pl-10 pr-10 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all"
                        placeholder="Retapez votre mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Cases à cocher */}
                  <div className="space-y-3 pt-1">
                    {/* 18+ */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isAdult}
                          onChange={(e) => setIsAdult(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 rounded-md border-2 border-white/20 peer-checked:border-amber-500 peer-checked:bg-amber-500 transition-all flex items-center justify-center">
                          {isAdult && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
                        <span className="text-red-400 font-semibold">*</span> Je certifie avoir plus de{" "}
                        <span className="text-amber-400 font-bold">18 ans</span> et comprends que les jeux d'argent sont interdits aux mineurs.
                      </span>
                    </label>

                    {/* CGU */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 rounded-md border-2 border-white/20 peer-checked:border-amber-500 peer-checked:bg-amber-500 transition-all flex items-center justify-center">
                          {acceptTerms && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                        </div>
                      </div>
                      <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors leading-relaxed">
                        <span className="text-red-400 font-semibold">*</span> J'accepte les{" "}
                        <Link href="/cgu" className="text-amber-400 hover:text-amber-300 underline">
                          conditions d'utilisation
                        </Link>{" "}
                        et la{" "}
                        <Link href="/confidentialite" className="text-amber-400 hover:text-amber-300 underline">
                          politique de confidentialité
                        </Link>.
                      </span>
                    </label>
                  </div>

                  {/* Erreur */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="text-red-400 text-sm text-center bg-red-500/10 py-2.5 rounded-xl border border-red-500/20"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Bouton submit */}
                  <button
                    type="submit"
                    disabled={isLoading || !isAdult || !acceptTerms}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-white/10 disabled:to-white/10 disabled:cursor-not-allowed text-black disabled:text-white/30 font-bold py-3.5 rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:shadow-none mt-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Séparateur Google */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-xs text-white/30">ou</span>
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

                {/* Avertissement légal */}
                <div className="mt-5 p-3 bg-amber-900/15 border border-amber-500/15 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-200/60 leading-relaxed">
                      <p className="font-semibold mb-0.5">Jouer comporte des risques : endettement, dépendance.</p>
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Aide :{" "}
                        <a href="tel:0974751313" className="text-amber-300 underline">
                          09 74 75 13 13
                        </a>
                        {" "}(appel non surtaxé)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lien login */}
                <p className="text-center text-white/30 text-sm mt-5">
                  Déjà membre ?{" "}
                  <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                    Se connecter
                  </Link>
                </p>

                {/* Sécurité */}
                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-white/20">
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
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-center py-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 250, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-[#30D158]" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Compte créé !</h2>
                <p className="text-white/40 text-sm">Bienvenue sur PronoScope. Redirection vers votre espace...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
