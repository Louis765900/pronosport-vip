// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
// AJOUT DES IMPORTS NÉCESSAIRES POUR LA NOUVELLE SECTION
import { Gift, Copy, Link2, CheckCircle, RefreshCw, Send, Terminal, MessageSquare, AlertTriangle } from "lucide-react"; 

// Types pour le brouillon - FORMAT DASHBOARD ADMIN
interface VipPick {
  match: string;
  pari: string;
  confiance: string;
  analyse: string;
  cote: number;
  league?: string;
  fixture_id?: number;
}

interface FreePick {
  match: string;
  pari: string;
  analyse: string;
  cote?: number;
  league?: string;
  fixture_id?: number;
}

interface DashboardAnalysis {
  intro: string;
  vip: VipPick | null;
  free: FreePick[];
  _meta?: {
    generated_at: string;
    dates_checked: string[];
    matches_found: number;
    status: string;
  };
}

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [draftRaw, setDraftRaw] = useState<DashboardAnalysis | null>(null);
  const [finalMessage, setFinalMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- NOUVEAUX ÉTATS POUR LES INVITATIONS ---
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fonction pour formater le message Telegram - NOUVEAU FORMAT
  const formatTelegramMessage = (data: DashboardAnalysis): string => {
    let text = `🔥 PRONOSPORT VIP - L'ANALYSE DU JOUR 🔥\n\n`;
    text += `${data.intro || "Analyse du jour"}\n\n`;

    // Section VIP
    if (data.vip) {
      const vip = data.vip;
      text += `💎 CONFIANCE VIP 💎\n`;
      text += `⚽ ${vip.match}\n`;
      if (vip.league) text += `🏆 ${vip.league}\n`;
      text += `🎯 ${vip.pari}\n`;
      text += `📈 Cote : ${vip.cote}\n`;
      text += `🛡️ Confiance : ${vip.confiance}\n`;
      text += `💡 ${vip.analyse}\n\n`;
    }

    // Section FREE
    if (data.free && data.free.length > 0) {
      text += `🛡️ LA SÉLECTION FREE 🛡️\n\n`;
      data.free.forEach((match) => {
        text += `🔹 ${match.match}\n`;
        if (match.league) text += `   🏆 ${match.league}\n`;
        text += `   👉 ${match.pari}\n`;
        if (match.cote) text += `   📈 Cote : ${match.cote}\n`;
        text += `   📝 ${match.analyse}\n\n`;
      });
    }

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🤖 Analyse LA PASSION VIP | 🔞 Jouez responsable`;

    return text;
  };

  // Vérifier si le brouillon est valide (nouveau format ou ancien)
  const isDraftValid = (draft: any): boolean => {
    if (!draft) return false;
    // Nouveau format: intro, vip, free
    if (draft.intro || draft.vip || (draft.free && draft.free.length > 0)) return true;
    // Ancien format (fallback): global_analysis, vip_match, free_matches
    if (draft.global_analysis || draft.vip_match || (draft.free_matches && draft.free_matches.length > 0)) return true;
    return false;
  };

  // Normaliser le brouillon vers le nouveau format
  const normalizeDraft = (draft: any): DashboardAnalysis => {
    // Si c'est déjà le nouveau format
    if (draft.intro !== undefined || draft.vip !== undefined || draft.free !== undefined) {
      return draft as DashboardAnalysis;
    }
    // Conversion depuis l'ancien format
    return {
      intro: draft.global_analysis || "Analyse du jour",
      vip: draft.vip_match ? {
        match: draft.vip_match.teams,
        pari: `${draft.vip_match.market}: ${draft.vip_match.prediction}`,
        confiance: draft.vip_match.staking?.label || "Safe",
        analyse: draft.vip_match.analysis,
        cote: draft.vip_match.odds,
        league: draft.vip_match.league,
        fixture_id: draft.vip_match.fixture_id
      } : null,
      free: (draft.free_matches || []).map((m: any) => ({
        match: m.teams,
        pari: `${m.market}: ${m.prediction}`,
        analyse: m.analysis,
        cote: m.odds,
        league: m.league,
        fixture_id: m.fixture_id
      })),
      _meta: draft._meta
    };
  };

  // --- NOUVELLE FONCTION : GÉNÉRER INVITATION ---
  const generateInvite = async () => {
    setInviteLoading(true);
    // On utilise la clé déjà saisie pour le login
    const secret = key || "Darkchoco2019*"; 

    try {
        const res = await fetch("/api/admin/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: secret })
        });
        const data = await res.json();
        
        if(data.success) {
            setInviteLink(data.link);
            setIsCopied(false);
        } else {
            alert("Erreur: " + (data.error || "Impossible de générer"));
        }
    } catch (e) {
        alert("Erreur réseau");
    } finally {
        setInviteLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 1. Connexion et Chargement du Brouillon
  const handleLogin = async () => {
    if (!key.trim()) {
      setStatus("❌ Veuillez entrer le mot de passe");
      return;
    }

    setIsLoading(true);
    setStatus("Chargement du brouillon...");

    try {
      const res = await fetch(`/api/admin/publish?key=${encodeURIComponent(key)}`);

      if (res.status === 401) {
        setStatus("❌ Mot de passe incorrect");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        setStatus(`❌ Erreur: ${errorData.error || 'Erreur serveur'}`);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      let draft = data.draft;

      // Parser si c'est une string
      if (typeof draft === 'string') {
        try {
          draft = JSON.parse(draft);
        } catch {
          draft = null;
        }
      }

      if (!isDraftValid(draft)) {
        setStatus("⚠️ Aucun brouillon trouvé. (Lance le CRON d'abord)");
        setDraftRaw(null);
        setFinalMessage("Aucun brouillon en attente.\n\nLance le CRON:\n/api/cron/daily?key=...");
        setIsLoggedIn(true);
        setIsLoading(false);
        return;
      }

      // Normaliser vers le nouveau format
      const normalizedDraft = normalizeDraft(draft);

      // Formater le message pour Telegram
      const formattedMessage = formatTelegramMessage(normalizedDraft);

      setDraftRaw(normalizedDraft);
      setFinalMessage(formattedMessage);
      setIsLoggedIn(true);
      setStatus("");

    } catch (e) {
      console.error(e);
      setStatus("❌ Erreur technique lors de la connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Envoi sur Telegram
  const handlePublish = async () => {
    if (!finalMessage.trim()) {
      alert("Le message est vide !");
      return;
    }

    if (!confirm("Es-tu sûr de vouloir envoyer ce message sur Telegram ?")) {
      return;
    }

    setIsLoading(true);
    setStatus("Envoi en cours...");

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: key,
          message: finalMessage
        })
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert("✅ Message envoyé avec succès sur Telegram !");
        setStatus("✅ Message envoyé !");
        setDraftRaw(null);
        setFinalMessage("Message envoyé. Rechargez la page pour voir un nouveau brouillon.");
      } else {
        alert(`❌ Erreur: ${result.error || 'Erreur inconnue'}`);
        setStatus(`❌ ${result.error || 'Erreur lors de l\'envoi'}`);
      }
    } catch (e) {
      console.error(e);
      setStatus("❌ Erreur réseau.");
      alert("❌ Erreur réseau lors de l'envoi.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Rafraîchir le brouillon
  const handleRefresh = async () => {
    setIsLoading(true);
    setStatus("Rechargement...");

    try {
      const res = await fetch(`/api/admin/publish?key=${encodeURIComponent(key)}`);
      const data = await res.json();

      let draft = data.draft;
      if (typeof draft === 'string') {
        try {
          draft = JSON.parse(draft);
        } catch {
          draft = null;
        }
      }

      if (isDraftValid(draft)) {
        const normalizedDraft = normalizeDraft(draft);
        setDraftRaw(normalizedDraft);
        setFinalMessage(formatTelegramMessage(normalizedDraft));
        setStatus("✅ Brouillon rechargé");
      } else {
        setStatus("⚠️ Aucun nouveau brouillon");
      }
    } catch {
      setStatus("❌ Erreur lors du rechargement");
    } finally {
      setIsLoading(false);
    }
  };

  // Écran de login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Accès Admin</h1>
          <p className="text-gray-400 text-sm mb-6 text-center">
            Entrez le mot de passe pour accéder au tableau de bord
          </p>
          <input
            type="password"
            placeholder="Mot de passe secret"
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white mb-4 focus:outline-none focus:border-blue-500"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? "Connexion..." : "Entrer"}
          </button>
          {status && (
            <p className="mt-4 text-center text-sm">{status}</p>
          )}
        </div>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">⚡ Dashboard Pronosport</h1>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          🔄 Rafraîchir le brouillon
        </button>
      </div>

      {/* --- SECTION AJOUTÉE : INVITATIONS VIP --- */}
      <section className="bg-gradient-to-r from-gray-900 to-black border border-yellow-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Gift size={100} className="text-yellow-500" />
          </div>
          <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Gift className="text-yellow-500" size={24} /> 
                          Golden Ticket VIP
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                          Générer un lien d'invitation pour le VIP gratuit !.
                      </p>
                  </div>
                  <button 
                      onClick={generateInvite} 
                      disabled={inviteLoading}
                      className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg shadow-yellow-900/20 active:scale-95 disabled:opacity-50"
                  >
                      {inviteLoading ? <RefreshCw className="animate-spin" size={18}/> : <Link2 size={18} />}
                      Générer un lien
                  </button>
              </div>

              {inviteLink && (
                  <div className="bg-black/50 border border-yellow-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                      <code className="text-green-400 font-mono text-sm break-all bg-black px-3 py-1 rounded border border-gray-800">
                          {inviteLink}
                      </code>
                      <button 
                          onClick={copyToClipboard} 
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isCopied ? "bg-green-500 text-black" : "bg-gray-800 hover:bg-gray-700 text-white"}`}
                      >
                          {isCopied ? <><CheckCircle size={18} /> Copié !</> : <><Copy size={18} /> Copier</>}
                      </button>
                  </div>
              )}
          </div>
      </section>

      {/* Métadonnées si disponibles */}
      {draftRaw?._meta && (
        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400 flex flex-wrap gap-4">
          <span>📅 Dates: {draftRaw._meta.dates_checked?.join(', ') || 'N/A'}</span>
          <span>⚽ Matchs analysés: {draftRaw._meta.matches_found || 0}</span>
          <span>✅ Status: {draftRaw._meta.status || 'N/A'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne Gauche : JSON Brut */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700 h-[600px] overflow-auto">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🧠 Données IA (Brut)
          </h2>
          <div className="text-xs">
            {draftRaw ? (
              <>
                {/* Résumé rapide */}
                <div className="mb-4 p-3 bg-gray-900 rounded-lg space-y-1">
                  <p className="text-green-400 font-medium">
                    💎 VIP: {draftRaw.vip ? draftRaw.vip.match : 'Aucun'}
                  </p>
                  {draftRaw.vip && (
                    <p className="text-green-300 text-xs pl-4">
                      → {draftRaw.vip.pari} @ {draftRaw.vip.cote}
                    </p>
                  )}
                  <p className="text-blue-400">
                    📋 Free: {draftRaw.free?.length || 0} matchs
                  </p>
                </div>
                {/* JSON complet */}
                <pre className="text-green-400 whitespace-pre-wrap bg-gray-900 p-3 rounded-lg">
                  {JSON.stringify(draftRaw, null, 2)}
                </pre>
              </>
            ) : (
              <p className="text-gray-500">Aucune donnée chargée</p>
            )}
          </div>
        </div>

        {/* Colonne Droite : Éditeur */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700 h-[600px] flex flex-col">
          <h2 className="text-xl font-bold mb-2">📢 Message Final (Editable)</h2>
          <p className="text-sm text-gray-400 mb-4">
            Tu peux modifier ce texte avant d'envoyer sur Telegram.
          </p>

          <textarea
            value={finalMessage}
            onChange={(e) => setFinalMessage(e.target.value)}
            className="flex-1 bg-gray-900 text-white p-3 rounded-lg border border-gray-600 font-mono text-sm mb-4 resize-none focus:outline-none focus:border-blue-500"
            placeholder="Le message formaté apparaîtra ici..."
          />

          <button
            onClick={handlePublish}
            disabled={isLoading || !finalMessage.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              "⏳ Envoi en cours..."
            ) : (
              "🚀 VALIDER & ENVOYER SUR TELEGRAM"
            )}
          </button>

          {status && (
            <p className="text-center mt-3 text-sm text-gray-300">{status}</p>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-6 text-center text-gray-500 text-xs">
        <p>💡 CRON: <code className="bg-gray-800 px-2 py-1 rounded">/api/cron/daily?key=...</code></p>
      </div>
    </div>
  );
}