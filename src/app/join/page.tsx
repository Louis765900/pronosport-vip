"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, Lock, Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function JoinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Redirection si pas de token
  useEffect(() => {
    if (!token) router.push("/");
  }, [token, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, token }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2000); // Redirection vers le dashboard
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Festif */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2831&auto=format&fit=crop')] bg-cover opacity-20 blur-sm"></div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 shadow-2xl"
      >
        {!success ? (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4 shadow-lg shadow-yellow-500/20">
                <Gift className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Invitation VIP Offerte</h1>
              <p className="text-gray-400 text-sm">Créez votre compte pour activer votre accès exclusif.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:border-yellow-500 outline-none transition" placeholder="votre@email.com" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold ml-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-black/50 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:border-yellow-500 outline-none transition" placeholder="••••••••" />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-500/20">{error}</p>}

              <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold py-3 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" /> : <>Activer mon Pass VIP <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-10">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl font-bold text-white mb-2">Compte Activé !</h2>
            <p className="text-gray-400">Redirection vers l'espace membre...</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}