import { NextRequest, NextResponse } from 'next/server'
import { Match } from '@/types'
import { Redis } from '@upstash/redis'
import { callPerplexity, isPerplexityAvailable } from '@/lib/ai/perplexity'
import { callGemini, isGeminiAvailable } from '@/lib/ai/gemini'
import { parseLLMJson } from '@/lib/ai/parseJSON'
import { getPerplexityDataPrompt, getGeminiReasoningPrompt } from '@/lib/ai/prompts'
import { getSportConfig } from '@/lib/config/sports'

// ── Redis pour le cache pronostic 24h ──
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || '',
})

function getCacheKey(match: Match): string {
  if (match.id) return `pronostic:${match.id}`
  const home = match.homeTeam.toLowerCase().replace(/\s+/g, '-')
  const away = match.awayTeam.toLowerCase().replace(/\s+/g, '-')
  return `pronostic:${home}:${away}:${match.date}`
}

// ── Traduction automatique des marchés en Français ──
function translateMarkets(pronostic: any): any {
  const FR: Record<string, string> = {
    'Both Teams To Score': 'Les deux équipes marquent',
    'Both Teams Score': 'Les deux équipes marquent',
    'BTTS': 'Les deux équipes marquent',
    'Double Chance': 'Chance Double',
    'Double Chance 1X': 'Chance Double 1X',
    'Double Chance X2': 'Chance Double X2',
    'Double Chance 12': 'Chance Double 12',
    'Over 0.5': 'Plus de 0.5 but',
    'Over 1.5': 'Plus de 1.5 buts',
    'Over 1.5 Goals': 'Plus de 1.5 buts',
    'Over 2.5': 'Plus de 2.5 buts',
    'Over 2.5 Goals': 'Plus de 2.5 buts',
    'Over 3.5': 'Plus de 3.5 buts',
    'Over 3.5 Goals': 'Plus de 3.5 buts',
    'Under 0.5': 'Moins de 0.5 but',
    'Under 1.5': 'Moins de 1.5 buts',
    'Under 1.5 Goals': 'Moins de 1.5 buts',
    'Under 2.5': 'Moins de 2.5 buts',
    'Under 2.5 Goals': 'Moins de 2.5 buts',
    'Under 3.5': 'Moins de 3.5 buts',
    '1N2': 'Résultat final',
    'Draw No Bet': 'Victoire sans nul',
    'Draw No Bet Home': 'Domicile sans nul',
    'Draw No Bet Away': 'Extérieur sans nul',
    'Asian Handicap': 'Handicap asiatique',
    'Correct Score': 'Score exact',
    'First Goalscorer': 'Premier buteur',
    'To Win': 'Victoire',
    'Home Win': 'Victoire domicile',
    'Away Win': 'Victoire extérieur',
    'Draw': 'Match nul',
    'Handicap -1': 'Handicap -1 but',
    'Handicap +1': 'Handicap +1 but',
    // Basketball
    'Spread': 'Handicap points',
    'Total Points': 'Total points',
    'Moneyline': 'Victoire directe',
    'First Quarter Winner': 'Vainqueur 1er quart',
    'Halftime Result': 'Résultat mi-temps',
    'Race to 20': 'Premier à 20 points',
    'Overtime': 'Prolongation',
    'Over Time': 'Prolongation',
    // Football américain (NFL)
    'First TD Scorer': 'Premier marqueur TD',
    'Total Touchdowns': 'Total touchdowns',
    'Safety': 'Safety marqué',
    // Hockey
    'Puck Line': 'Puck Line (Handicap rondelle)',
    'Power Play Goal': 'But en supériorité numérique',
    'Shutout': 'Blanchissage gardien',
    'Period 1 Total': 'Total buts 1ère période',
    // Baseball
    'Run Line': 'Run Line (Handicap courses)',
    'First 5 Innings': 'Vainqueur des 5 premières manches',
    'Extra Innings': 'Manches supplémentaires',
    'Home Run': 'Home Run dans le match',
    // F1
    'Fastest Lap': 'Meilleur tour en course',
    'Safety Car': 'Voiture de sécurité (Safety Car)',
    'Pole to Win': 'Pole position → Victoire',
    'Race Winner': 'Vainqueur de la course',
    'Constructor Winner': 'Vainqueur constructeur',
    // MMA
    'Fight Winner': 'Vainqueur du combat',
    'Method of Victory': 'Méthode de victoire',
    'KO/TKO': 'KO / TKO',
    'Submission': 'Soumission',
    'Decision': 'Décision des juges',
    'Round Betting': 'Round exact de fin',
    'First Knockdown': 'Premier knockdown',
    // Rugby
    'First Try Scorer': 'Premier essai',
    'Total Tries': 'Total essais',
    'Both Teams To Score Tries': 'Les deux équipes marquent des essais',
    // Handball
    'First Half Winner': 'Vainqueur 1ère mi-temps',
    '7 Meter Penalty': '7 mètres accordé',
    // Volleyball
    'Exact Sets': 'Résultat exact en sets',
    'Set 1 Winner': 'Vainqueur du set 1',
    'Tie-Break': 'Tie-break joué',
    // AFL
    'First Goal': 'Premier but (AFL)',
    'Margin Range': 'Écart victoire',
    // Generic
    'HT/FT': 'Mi-temps / Temps réglementaire',
    'Yes': 'Oui',
    'No': 'Non',
  }

  function tr(text: string | undefined): string {
    if (!text) return text ?? ''
    if (FR[text]) return FR[text]
    let out = text
    for (const [en, fr] of Object.entries(FR)) {
      out = out.replace(new RegExp(`\\b${en}\\b`, 'gi'), fr)
    }
    return out
  }

  if (pronostic.vip_tickets?.safe) {
    pronostic.vip_tickets.safe.market = tr(pronostic.vip_tickets.safe.market)
    pronostic.vip_tickets.safe.selection = tr(pronostic.vip_tickets.safe.selection)
  }
  if (pronostic.vip_tickets?.fun) {
    pronostic.vip_tickets.fun.market = tr(pronostic.vip_tickets.fun.market)
    pronostic.vip_tickets.fun.selection = tr(pronostic.vip_tickets.fun.selection)
  }
  if (pronostic.predictions?.main_market) {
    pronostic.predictions.main_market.market = tr(pronostic.predictions.main_market.market)
  }

  // Traduire les marchés complémentaires
  if (Array.isArray(pronostic.additional_markets)) {
    pronostic.additional_markets = pronostic.additional_markets.map((m: any) => ({
      ...m,
      market: tr(m.market),
      selection: tr(m.selection),
    }))
  }

  // Importance en français
  const IMP: Record<string, string> = { 'High': 'Élevée', 'Medium': 'Moyenne', 'Low': 'Faible' }
  if (pronostic.analysis?.missing_players) {
    pronostic.analysis.missing_players = pronostic.analysis.missing_players.map((p: any) => ({
      ...p,
      importance: IMP[p.importance] ?? p.importance,
    }))
  }

  return pronostic
}

// ── Les prompts sont maintenant dans src/lib/ai/prompts/ (sport-aware) ──

// ── Mock response (mode sans clé API) ──
function getMockResponse(match: Match) {
  return {
    analysis: {
      context: `${match.homeTeam} reçoit ${match.awayTeam} dans un match important de ${match.league}. Les deux équipes sont en forme et ce derby s'annonce disputé.`,
      key_stats: [
        { label: 'Forme récente (5 derniers)', value: '3V 1N 1D', impact: 'positive' },
        { label: 'Buts marqués/match', value: '2.1', impact: 'positive' },
        { label: 'Clean sheets saison', value: '40%', impact: 'neutral' },
      ],
      missing_players: [],
      weather: 'Temps clair, conditions optimales de jeu',
      referee_tendency: 'Arbitre strict sur les fautes, 4.2 cartons jaunes/match en moyenne',
      home_team_stats: { attack: 75, defense: 68, form: 80, morale: 72, h2h: 60 },
      away_team_stats: { attack: 70, defense: 65, form: 55, morale: 60, h2h: 40 },
      h2h_history: { results: ['V', 'N', 'D', 'V', 'N'], home_wins: 2, draws: 2, away_wins: 1 },
    },
    predictions: {
      main_market: {
        market: 'Résultat final',
        selection: '1',
        odds_estimated: 1.85,
        confidence: 75,
        reason: 'Avantage domicile et meilleure forme récente sur 5 matchs',
      },
      score_exact: '2-1',
      btts_prob: 62,
      over_2_5_prob: 58,
    },
    vip_tickets: {
      safe: {
        market: 'Chance Double 1X',
        selection: '1X',
        odds_estimated: 1.25,
        confidence: 82,
        reason: 'Sécurité maximale — domicile invaincu depuis 6 matchs, extérieur en difficulté',
        bankroll_percent: 5,
      },
      fun: {
        market: 'Plus de 2.5 buts',
        selection: 'Plus de 2.5',
        odds_estimated: 2.1,
        ev_value: 8.5,
        risk_analysis: 'Value positive : les deux équipes marquent en moyenne 3.1 buts/match combinés',
        bankroll_percent: 2,
      },
    },
  }
}

// ── Telegram auto-alert pour tickets SAFE / VALUE ──
async function notifyTelegram(match: Match, pronostic: ReturnType<typeof getMockResponse>) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const safe = pronostic.vip_tickets?.safe
  const fun = pronostic.vip_tickets?.fun
  const isSafe = (safe?.confidence ?? 0) >= 78
  const isValue = (fun?.ev_value ?? 0) >= 7

  if (!isSafe && !isValue) return

  const lines: string[] = []
  lines.push(`🔭 *PronoScope — Alerte Pronostic*`)
  lines.push(``)
  const sportEmoji = getSportConfig(match.sport ?? 'football').emoji
  lines.push(`${sportEmoji} *${match.homeTeam}* vs *${match.awayTeam}*`)
  lines.push(`🏆 ${match.league} · ${match.time || match.date}`)
  lines.push(``)

  if (isSafe) {
    lines.push(`✅ *TICKET SAFE* (${safe.confidence}% confiance)`)
    lines.push(`   Marché : ${safe.market}`)
    lines.push(`   Sélection : *${safe.selection}* @ ${(safe.odds_estimated ?? 0).toFixed(2)}`)
    lines.push(`   Mise conseillée : ${safe.bankroll_percent ?? 5}% bankroll`)
  }

  if (isValue) {
    if (isSafe) lines.push(``)
    lines.push(`💎 *TICKET VALUE* (+${(fun.ev_value ?? 0).toFixed(1)}% EV)`)
    lines.push(`   Marché : ${fun.market}`)
    lines.push(`   Sélection : *${fun.selection}* @ ${(fun.odds_estimated ?? 0).toFixed(2)}`)
    lines.push(`   Mise conseillée : ${fun.bankroll_percent ?? 2}% bankroll`)
  }

  lines.push(``)
  lines.push(`👉 [Voir l'analyse complète](https://pronoscope.vercel.app)`)

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    })
    console.log(`  📨 Telegram alert sent for ${match.homeTeam} vs ${match.awayTeam}`)
  } catch (e) {
    console.warn('  ⚠️ Telegram alert failed:', e)
  }
}

// ── Validation & defaults ──
function validateAndNormalize(pronostic: any) {
  if (!pronostic.analysis || !pronostic.predictions || !pronostic.vip_tickets) {
    throw new Error('Structure de réponse invalide: ' + Object.keys(pronostic).join(', '))
  }

  if (!pronostic.analysis.key_stats) pronostic.analysis.key_stats = []
  if (!pronostic.analysis.missing_players) pronostic.analysis.missing_players = []

  if (!pronostic.vip_tickets.safe?.bankroll_percent) {
    pronostic.vip_tickets.safe = { ...pronostic.vip_tickets.safe, bankroll_percent: 5 }
  }
  if (!pronostic.vip_tickets.fun?.bankroll_percent) {
    pronostic.vip_tickets.fun = { ...pronostic.vip_tickets.fun, bankroll_percent: 2 }
  }

  // Normaliser les stats en nombres (l'IA peut renvoyer des strings)
  const toStatNum = (v: unknown): number => {
    const n = Number(v)
    return isFinite(n) && n >= 0 ? Math.min(Math.round(n), 100) : 50
  }
  const normalizeStats = (s: any) => ({
    attack: toStatNum(s?.attack),
    defense: toStatNum(s?.defense),
    form: toStatNum(s?.form),
    morale: toStatNum(s?.morale),
    h2h: toStatNum(s?.h2h),
  })
  const defaultStats = { attack: 50, defense: 50, form: 50, morale: 50, h2h: 50 }
  pronostic.analysis.home_team_stats = pronostic.analysis.home_team_stats
    ? normalizeStats(pronostic.analysis.home_team_stats)
    : defaultStats
  pronostic.analysis.away_team_stats = pronostic.analysis.away_team_stats
    ? normalizeStats(pronostic.analysis.away_team_stats)
    : defaultStats

  // Valider et nettoyer additional_markets
  if (Array.isArray(pronostic.additional_markets)) {
    pronostic.additional_markets = pronostic.additional_markets
      .filter((m: any) => m && typeof m.market === 'string' && typeof m.selection === 'string' && Number(m.odds_estimated) >= 1.0)
      .slice(0, 8)
  } else {
    pronostic.additional_markets = []
  }

  // Normaliser les résultats H2H : accepter W/D/L ET V/N/D, mapper tout en V/N/D pour l'affichage
  const H2H_MAP: Record<string, 'V' | 'N' | 'D'> = {
    W: 'V', V: 'V',
    D: 'N', N: 'N',
    L: 'D',
  }
  if (!pronostic.analysis.h2h_history) {
    pronostic.analysis.h2h_history = { results: ['N', 'N', 'N', 'N', 'N'], home_wins: 0, draws: 5, away_wins: 0 }
  } else if (Array.isArray(pronostic.analysis.h2h_history.results)) {
    pronostic.analysis.h2h_history.results = pronostic.analysis.h2h_history.results
      .map((r: string) => H2H_MAP[r] ?? 'N')
  }

  return pronostic
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const match: Match = body.match

    if (!match || !match.homeTeam || !match.awayTeam) {
      return NextResponse.json(
        { success: false, error: 'Données du match invalides' },
        { status: 400 },
      )
    }

    const forceRefresh = body.forceRefresh === true

    // ── CACHE CHECK : pronostic figé 24h par match ──
    const cacheKey = getCacheKey(match)
    if (!forceRefresh) {
      try {
        const cached = await redis.get<{ data: any; pipeline: string }>(cacheKey)
        if (cached) {
          console.log(`⚡ [Pronostic Cache HIT] ${cacheKey}`)
          return NextResponse.json({ success: true, ...cached, cached: true })
        }
      } catch { /* ignore cache errors */ }
    } else {
      console.log(`🔄 [Pronostic Cache BYPASS] ${cacheKey} — forceRefresh demandé`)
      try { await redis.del(cacheKey) } catch { /* ignore */ }
    }

    const hasPerplexity = isPerplexityAvailable()
    const hasGemini = isGeminiAvailable()

    // Helper pour sauvegarder en cache + notifier Telegram
    const finalize = async (pronostic: any, pipeline: string) => {
      const translated = translateMarkets(validateAndNormalize(pronostic))
      void notifyTelegram(match, translated)
      try {
        await redis.set(cacheKey, { data: translated, pipeline }, { ex: 86400 })
        console.log(`  💾 [Pronostic Cache SET] ${cacheKey} (24h)`)
      } catch { /* ignore cache errors */ }
      return NextResponse.json({ success: true, data: translated, pipeline })
    }

    // ── MODE 1 : DUAL-LLM (Perplexity data + Gemini reasoning) ──
    if (hasPerplexity && hasGemini) {
      console.log('🔗 Dual-LLM Pipeline:', match.homeTeam, 'vs', match.awayTeam)

      try {
        console.log('  📡 Step 1: Perplexity data collection...')
        const rawData = await callPerplexity(getPerplexityDataPrompt(match), {
          model: 'sonar-pro',
          maxTokens: 1500,
        })
        console.log('  ✅ Perplexity data collected:', rawData.length, 'chars')

        console.log('  🧠 Step 2: Gemini reasoning...')
        const reasonedContent = await callGemini(getGeminiReasoningPrompt(match, rawData), {
          systemInstruction:
            'Tu es un analyste expert en paris sportifs. Tu raisonnes de maniere statistique et rigoureuse. Reponds TOUJOURS en JSON valide et en FRANCAIS.',
          maxOutputTokens: 2048,
        })
        console.log('  ✅ Gemini reasoning complete:', reasonedContent.length, 'chars')

        return await finalize(parseLLMJson(reasonedContent), 'dual')
      } catch (dualError) {
        console.warn('⚠️ Dual pipeline failed, falling back to Perplexity-only:', dualError)
      }
    }

    // ── MODE 2 : PERPLEXITY SEUL (fallback) ──
    if (hasPerplexity) {
      console.log('📡 Perplexity-only:', match.homeTeam, 'vs', match.awayTeam)

      try {
        const content = await callPerplexity(getPerplexityDataPrompt(match), {
          model: 'sonar-pro',
          maxTokens: 2000,
        })
        return await finalize(parseLLMJson(content), 'perplexity')
      } catch (perplexityError) {
        console.warn('⚠️ Perplexity-only failed:', perplexityError)
      }
    }

    // ── MODE 3 : GEMINI SEUL (dégradé) ──
    if (hasGemini) {
      console.log('🧠 Gemini-only (degraded):', match.homeTeam, 'vs', match.awayTeam)

      const geminiDegradedData = `{
  "injuries_suspensions": {"home": [], "away": []},
  "recent_form": {"home": null, "away": null},
  "h2h": null,
  "current_odds": null,
  "weather": null,
  "referee": null,
  "xg": null,
  "ranking_context": null,
  "tactical_notes": null,
  "_warning": "AUCUNE DONNEE TEMPS REEL DISPONIBLE. Tu ne dois mentionner AUCUN joueur par son nom dans missing_players car tu n'as pas de données fiables sur les blessés actuels. Laisse missing_players vide. Base-toi uniquement sur des faits généraux (avantage domicile, statistiques de la compétition) sans inventer de données individuelles."
}`

      try {
        const content = await callGemini(
          getGeminiReasoningPrompt(match, geminiDegradedData),
          {
            systemInstruction:
              'Tu es un analyste expert en paris sportifs. Reponds en JSON valide et en FRANCAIS. IMPORTANT: Tu n\'as PAS de données temps réel. Ne mentionne AUCUN joueur par son nom. Ne cite PAS de blessés. Laisse missing_players = []. Analyses générales uniquement.',
            maxOutputTokens: 2048,
          },
        )
        return await finalize(parseLLMJson(content), 'gemini')
      } catch (geminiError) {
        console.warn('⚠️ Gemini-only failed:', geminiError)
      }
    }

    // ── MODE 4 : MOCK (aucune clé API) ──
    console.log('🎭 Mock mode:', match.homeTeam, 'vs', match.awayTeam)
    return NextResponse.json({ success: true, data: getMockResponse(match), pipeline: 'mock' })
  } catch (error) {
    console.error('Pronostic API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 },
    )
  }
}
