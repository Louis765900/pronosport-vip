// src/app/api/cron/daily/route.ts
// ═══════════════════════════════════════════════════════════════
// POLITIQUE : ZERO FAKE DATA
// Si aucun match réel n'est trouvé, on retourne "Aucun match"
// On n'invente JAMAIS de matchs fictifs
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

// Dates hardcodées pour contourner le bug d'année serveur (2026 au lieu de 2025)
function getFixedDates(): string[] {
  return ["2025-01-21", "2025-01-22"];
}

// IDs des ligues prioritaires
// 2 = Champions League, 3 = Europa League, 39 = Premier League
// 140 = La Liga, 135 = Serie A, 78 = Bundesliga, 61 = Ligue 1
const LEAGUE_IDS = "2-3-39-140-135-78-61";

// ═══════════════════════════════════════════════════════════════
// HELPER: PERPLEXITY API
// ═══════════════════════════════════════════════════════════════

async function askPerplexity(query: string): Promise<string | null> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.log("[PERPLEXITY] API Key manquante - skip");
    return null;
  }

  try {
    console.log("[PERPLEXITY] Envoi de la requête...");

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en football. Réponds de manière précise et concise avec uniquement des faits vérifiables. Si tu ne connais pas une information, dis-le.'
          },
          { role: 'user', content: query }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[PERPLEXITY] Erreur API:", res.status, errorText);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      console.log("[PERPLEXITY] Réponse reçue:", content.substring(0, 100) + "...");
      return content;
    }

    return null;
  } catch (e) {
    console.error("[PERPLEXITY] Exception:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: API FOOTBALL
// ═══════════════════════════════════════════════════════════════

async function fetchMatchesForDate(date: string, apiKey: string): Promise<any[]> {
  try {
    console.log(`[API-FOOTBALL] Récupération des matchs pour ${date}...`);

    const url = `https://v3.football.api-sports.io/fixtures?date=${date}&league=${LEAGUE_IDS}&timezone=Europe/Paris`;

    const res = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`[API-FOOTBALL] Erreur HTTP: ${res.status}`);
      return [];
    }

    const data = await res.json();

    // Vérifier les erreurs API
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("[API-FOOTBALL] Erreurs API:", data.errors);
      return [];
    }

    const matches = data.response || [];
    console.log(`[API-FOOTBALL] ${matches.length} matchs trouvés pour ${date}`);

    return matches;
  } catch (e) {
    console.error(`[API-FOOTBALL] Exception pour ${date}:`, e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: GROQ AI
// ═══════════════════════════════════════════════════════════════

async function generateAnalysisWithGroq(
  matches: any[],
  vipMatch: any,
  perplexityAnalysis: string | null,
  groqKey: string
): Promise<string | null> {
  try {
    console.log("[GROQ] Génération de l'analyse...");

    // Préparer la liste des matchs RÉELS pour le prompt
    const matchesList = matches.slice(0, 5).map((m: any) => ({
      id: m.fixture?.id,
      teams: `${m.teams?.home?.name} vs ${m.teams?.away?.name}`,
      league: m.league?.name,
      date: m.fixture?.date,
      status: m.fixture?.status?.long
    }));

    const vipTitle = `${vipMatch.teams?.home?.name} vs ${vipMatch.teams?.away?.name}`;

    const systemPrompt = `Tu es un expert en paris sportifs professionnels. Tu dois générer une analyse quotidienne au format JSON STRICT.

IMPORTANT: Tu dois UNIQUEMENT utiliser les matchs fournis ci-dessous. N'invente AUCUN match.

MATCHS DISPONIBLES (DONNÉES RÉELLES):
${JSON.stringify(matchesList, null, 2)}

MATCH VIP SÉLECTIONNÉ: ${vipTitle}
${perplexityAnalysis ? `ANALYSE PERPLEXITY (blessures, forme): ${perplexityAnalysis}` : 'Pas d\'analyse Perplexity disponible'}

RÈGLES STRICTES:
1. Utilise UNIQUEMENT les matchs de la liste ci-dessus
2. Le VIP doit avoir une cote réaliste entre 1.50 et 2.00
3. Les free picks doivent avoir des cotes entre 1.80 et 2.50
4. L'analyse doit être factuelle et professionnelle
5. Ne propose PAS de matchs qui ne sont pas dans la liste

FORMAT JSON OBLIGATOIRE:
{
  "intro": "Introduction de 2-3 phrases sur la journée de football",
  "vip": {
    "match": "${vipTitle}",
    "pari": "Type de pari (Over 2.5, BTTS, 1X, etc.)",
    "confiance": "Safe ou Ultra-Safe",
    "analyse": "Explication en 2-3 phrases",
    "cote": 1.75,
    "league": "${vipMatch.league?.name}",
    "fixture_id": ${vipMatch.fixture?.id}
  },
  "free": [
    // 1-2 matchs de la liste uniquement
  ]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Génère l'analyse du jour au format JSON. Utilise UNIQUEMENT les matchs de la liste fournie." }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[GROQ] Erreur API:", res.status, errorText);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("[GROQ] Analyse générée avec succès");
    return content;
  } catch (e) {
    console.error("[GROQ] Exception:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPER: SAUVEGARDE "AUCUN MATCH"
// ═══════════════════════════════════════════════════════════════

async function saveNoMatchDraft(redis: Redis, dates: string[], reason: string) {
  const noMatchDraft = {
    intro: "Aucun match des grandes ligues européennes n'est programmé aujourd'hui. Revenez demain pour de nouvelles analyses !",
    vip: null,
    free: [],
    _meta: {
      generated_at: new Date().toISOString(),
      dates_checked: dates,
      matches_found: 0,
      status: "no_matches",
      reason: reason
    }
  };

  await redis.set("draft:daily:pronostics", JSON.stringify(noMatchDraft));
  console.log("[REDIS] Draft 'Aucun match' sauvegardé");
}

// ═══════════════════════════════════════════════════════════════
// HELPER: SAUVEGARDE ERREUR
// ═══════════════════════════════════════════════════════════════

async function saveDraftError(redis: Redis, errorMessage: string, dates: string[]) {
  const errorDraft = {
    intro: "Une erreur technique s'est produite lors de la génération. Veuillez réessayer.",
    vip: null,
    free: [],
    error: errorMessage,
    _meta: {
      generated_at: new Date().toISOString(),
      dates_checked: dates,
      status: "error"
    }
  };

  await redis.set("draft:daily:pronostics", JSON.stringify(errorDraft));
  console.log("[REDIS] Draft d'erreur sauvegardé");
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function GET(req: Request) {
  console.log("═══════════════════════════════════════════════════");
  console.log("[CRON] Démarrage du job quotidien (ZERO FAKE DATA)");
  console.log("═══════════════════════════════════════════════════");

  const dates = getFixedDates();

  try {
    // 1. SÉCURISATION
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key !== process.env.ADMIN_SECRET) {
      console.log("[CRON] Accès refusé - clé invalide");
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 401 });
    }

    // 2. INITIALISATION REDIS
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL!,
      token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN!,
    });

    const footballKey = process.env.API_FOOTBALL_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // 3. VALIDATION DES CLÉS API
    if (!footballKey) {
      console.error("[CRON] API_FOOTBALL_KEY manquante");
      await saveDraftError(redis, "Clé API Football manquante", dates);
      return NextResponse.json({ error: "API_FOOTBALL_KEY manquante" }, { status: 500 });
    }

    if (!groqKey) {
      console.error("[CRON] GROQ_API_KEY manquante");
      await saveDraftError(redis, "Clé API Groq manquante", dates);
      return NextResponse.json({ error: "GROQ_API_KEY manquante" }, { status: 500 });
    }

    // 4. RÉCUPÉRATION DES MATCHS RÉELS
    console.log(`[CRON] Dates à vérifier: ${dates.join(', ')}`);

    let allMatches: any[] = [];

    for (const date of dates) {
      const matches = await fetchMatchesForDate(date, footballKey);
      allMatches = allMatches.concat(matches);
    }

    console.log(`[CRON] Total matchs récupérés: ${allMatches.length}`);

    // ═══════════════════════════════════════════════════════════════
    // POLITIQUE ZERO FAKE DATA
    // Si aucun match réel → on s'arrête proprement
    // ═══════════════════════════════════════════════════════════════
    if (allMatches.length === 0) {
      console.log("[CRON] AUCUN MATCH TROUVÉ - Pas de fake data");
      await saveNoMatchDraft(redis, dates, "API Football n'a retourné aucun match pour ces dates");

      return NextResponse.json({
        success: true,
        message: "Aucun match trouvé pour les dates spécifiées",
        stats: {
          dates_checked: dates,
          matches_found: 0,
          status: "no_matches"
        }
      });
    }

    // 5. SÉLECTION DU MATCH VIP (Champions League prioritaire)
    const ldcMatches = allMatches.filter((m: any) => m.league?.id === 2);
    const europaMatches = allMatches.filter((m: any) => m.league?.id === 3);
    const premierLeagueMatches = allMatches.filter((m: any) => m.league?.id === 39);

    // Priorité: LDC > Europa > Premier League > Premier match disponible
    let vipMatch;
    if (ldcMatches.length > 0) {
      vipMatch = ldcMatches[0];
    } else if (europaMatches.length > 0) {
      vipMatch = europaMatches[0];
    } else if (premierLeagueMatches.length > 0) {
      vipMatch = premierLeagueMatches[0];
    } else {
      vipMatch = allMatches[0];
    }

    const vipTitle = `${vipMatch.teams?.home?.name} vs ${vipMatch.teams?.away?.name}`;
    console.log(`[CRON] Match VIP sélectionné: ${vipTitle} (${vipMatch.league?.name})`);

    // 6. APPEL PERPLEXITY POUR ENRICHISSEMENT (optionnel)
    let perplexityAnalysis: string | null = null;

    if (process.env.PERPLEXITY_API_KEY) {
      console.log("[CRON] Interrogation de Perplexity...");
      const perplexityQuery = `Analyse le match de football ${vipTitle} (${vipMatch.league?.name}).
      Donne-moi uniquement des FAITS VÉRIFIABLES:
      1. Les joueurs blessés ou suspendus majeurs des deux équipes
      2. La forme récente des équipes (5 derniers matchs)
      3. Un avis sur le pronostic le plus sûr (Over 2.5, BTTS, ou résultat)
      Réponds en 3-4 phrases maximum, sans inventer d'informations.`;

      perplexityAnalysis = await askPerplexity(perplexityQuery);
    }

    // 7. GÉNÉRATION AVEC GROQ
    console.log("[CRON] Génération de l'analyse avec Groq...");
    const analysisContent = await generateAnalysisWithGroq(
      allMatches,
      vipMatch,
      perplexityAnalysis,
      groqKey
    );

    if (!analysisContent) {
      console.error("[CRON] Échec de la génération Groq");
      await saveDraftError(redis, "Échec génération IA", dates);
      return NextResponse.json({ error: "Échec génération IA" }, { status: 500 });
    }

    // 8. VALIDATION ET ENRICHISSEMENT DU JSON
    let finalAnalysis: any;
    try {
      finalAnalysis = JSON.parse(analysisContent);

      // Ajout des métadonnées
      finalAnalysis._meta = {
        generated_at: new Date().toISOString(),
        dates_checked: dates,
        matches_found: allMatches.length,
        vip_match: vipTitle,
        vip_league: vipMatch.league?.name,
        perplexity_used: !!perplexityAnalysis,
        status: "success"
      };

      // Injection de l'analyse Perplexity si disponible
      if (perplexityAnalysis) {
        finalAnalysis.perplexity_analysis = perplexityAnalysis;
      }

    } catch (parseError) {
      console.error("[CRON] Erreur parsing JSON:", parseError);
      await saveDraftError(redis, "Erreur parsing JSON IA", dates);
      return NextResponse.json({ error: "Erreur parsing JSON" }, { status: 500 });
    }

    // 9. SAUVEGARDE DANS REDIS
    await redis.set("draft:daily:pronostics", JSON.stringify(finalAnalysis));
    console.log("[CRON] Draft sauvegardé dans Redis");

    // 10. RÉPONSE
    console.log("═══════════════════════════════════════════════════");
    console.log("[CRON] Job terminé avec succès!");
    console.log("═══════════════════════════════════════════════════");

    return NextResponse.json({
      success: true,
      message: "Analyse générée avec succès (données réelles uniquement)",
      stats: {
        dates_checked: dates,
        matches_found: allMatches.length,
        vip_match: vipTitle,
        vip_league: vipMatch.league?.name,
        perplexity_used: !!perplexityAnalysis
      }
    });

  } catch (error: any) {
    console.error("[CRON] Erreur fatale:", error);

    // Tentative de sauvegarde d'erreur
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL!,
        token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN!,
      });
      await saveDraftError(redis, error.message, dates);
    } catch (redisError) {
      console.error("[CRON] Impossible de sauvegarder l'erreur dans Redis");
    }

    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
