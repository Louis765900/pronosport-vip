import { NextRequest, NextResponse } from 'next/server'
import { Match, PronosticResponse } from '@/types'

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

const SYSTEM_PROMPT = `Tu es l'Analyste Senior de "La Passion VIP", un expert en paris sportifs professionnels.

## TA MÉTHODOLOGIE STRICTE :

### 1. DEEP RESEARCH (Recherche en temps réel)
- Absents confirmés (blessures, suspensions, choix tactiques)
- Conditions météo au stade
- Arbitre désigné et son historique (cartons, penalties)
- Forme récente des 2 équipes (5 derniers matchs toutes compétitions)
- Contexte du match (rivalité, enjeu, fatigue calendrier)

### 2. ANALYSE STATISTIQUE
- xG (Expected Goals) des 2 équipes sur les 10 derniers matchs
- Stats H2H (Head to Head) des 5 dernières confrontations
- Statistiques domicile/extérieur
- Efficacité offensive et défensive

### 3. VALUE BETTING
- Calcule les probabilités réelles pour chaque issue (1/N/2)
- Compare avec les cotes moyennes du marché
- Identifie la VALUE (EV positive = cote marché > fair odds)

### 4. GÉNÉRATION DE TICKETS

**TICKET SAFE (Bankroll 5%)**
- Confiance minimum : 70%
- Cote minimum estimée : 1.60
- Types de paris : 1N2, Double Chance, DNB, Over/Under 1.5

**TICKET FUN (Bankroll 1-2%)**
- Value détectée (EV > 5%)
- Cote minimum : 2.00
- Types de paris : BTTS, Score Exact, Buteur, Asian Handicap, Combiné

## FORMAT DE RÉPONSE OBLIGATOIRE

Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après.
Pas de markdown, pas de backticks, juste le JSON brut.

Structure exacte à respecter :

{
  "analysis": {
    "context": "Synthèse du contexte et des enjeux du match en 2-3 phrases",
    "key_stats": [
      {"label": "Forme domicile", "value": "4V 1N 0D", "impact": "positive"},
      {"label": "xG moyen équipe A", "value": "1.8", "impact": "positive"},
      {"label": "Clean sheets extérieur", "value": "1 sur 5", "impact": "negative"}
    ],
    "missing_players": [
      {"team": "Equipe A", "player": "Joueur X", "importance": "High"},
      {"team": "Equipe B", "player": "Joueur Y", "importance": "Medium"}
    ],
    "weather": "Description météo si pertinent",
    "referee_tendency": "Tendance de l'arbitre si trouvée",
    "home_team_stats": {
      "attack": 75,
      "defense": 68,
      "form": 80,
      "morale": 72,
      "h2h": 60
    },
    "away_team_stats": {
      "attack": 70,
      "defense": 65,
      "form": 55,
      "morale": 60,
      "h2h": 40
    },
    "h2h_history": {
      "results": ["W", "D", "L", "W", "W"],
      "home_wins": 3,
      "draws": 1,
      "away_wins": 1
    }
  },
  "predictions": {
    "main_market": {
      "selection": "1",
      "probability_percent": 55,
      "fair_odds": 1.82
    },
    "score_exact": "2-1",
    "btts_prob": 62,
    "over_2_5_prob": 58
  },
  "vip_tickets": {
    "safe": {
      "market": "Victoire Equipe ou Nul (Double Chance)",
      "selection": "1X",
      "odds_estimated": 1.45,
      "confidence": 78,
      "reason": "Explication courte de pourquoi ce pari est sûr",
      "bankroll_percent": 5
    },
    "fun": {
      "market": "BTTS + Over 2.5",
      "selection": "Oui",
      "odds_estimated": 2.10,
      "ev_value": 8.5,
      "risk_analysis": "Analyse du risque et pourquoi ça peut passer",
      "bankroll_percent": 2
    }
  }
}

RÈGLES IMPORTANTES :
- Les probabilités doivent être réalistes et basées sur les données trouvées
- fair_odds = 100 / probability_percent
- ev_value = ((probability_percent / 100) * odds_estimated - 1) * 100
- Si tu ne trouves pas d'info sur les absents, mets un tableau vide []
- Sois honnête sur le niveau de confiance
- home_team_stats et away_team_stats : scores de 0 à 100 basés sur les stats réelles
- h2h_history.results : tableau de 5 éléments (W=victoire dom, D=nul, L=défaite dom) du plus récent au plus ancien`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const match: Match = body.match

    console.log('=== La Passion VIP - Pronostic Request ===')
    console.log('Match:', match?.homeTeam, 'vs', match?.awayTeam)

    if (!match || !match.homeTeam || !match.awayTeam) {
      return NextResponse.json(
        { success: false, error: 'Données du match invalides' },
        { status: 400 }
      )
    }

    const apiKey = process.env.PERPLEXITY_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Clé API Perplexity non configurée' },
        { status: 500 }
      )
    }

    const userPrompt = `Analyse ce match de football et génère un pronostic VIP complet :

**MATCH**
${match.homeTeam} (Domicile) vs ${match.awayTeam} (Extérieur)

**COMPÉTITION**
${match.league}

**DATE & HEURE**
${match.date} à ${match.time}

**LIEU**
${match.stade || 'Stade non spécifié'}

---

INSTRUCTIONS :
1. Recherche les dernières vrais infos sur ce match (absents, forme, stats)
2. Calcule les probabilités réelles
3. Génère les tickets SAFE et FUN selon la méthodologie La Passion VIP
4. Réponds UNIQUEMENT avec le JSON, sans aucun texte autour`

    const requestBody = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    }

    console.log('Sending to Perplexity...')

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log('Perplexity status:', response.status)

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Perplexity API Error:', errorBody)

      let errorMessage = `Erreur API (${response.status})`
      try {
        const errorJson = JSON.parse(errorBody)
        errorMessage = errorJson.error?.message || errorJson.detail || errorMessage
      } catch {
        // Keep default message
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error('Empty response from Perplexity')
      return NextResponse.json(
        { success: false, error: 'Réponse vide de l\'IA' },
        { status: 500 }
      )
    }

    console.log('Raw content (first 500 chars):', content.substring(0, 500))

    // Parse JSON
    let pronostic: PronosticResponse
    try {
      let cleanContent = content.trim()

      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3)
      }

      // Find JSON boundaries
      const firstBrace = cleanContent.indexOf('{')
      const lastBrace = cleanContent.lastIndexOf('}')

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1)
      }

      pronostic = JSON.parse(cleanContent)

      // Validate structure
      if (!pronostic.analysis || !pronostic.predictions || !pronostic.vip_tickets) {
        throw new Error('Structure JSON incomplète')
      }

      // Ensure arrays exist
      if (!pronostic.analysis.key_stats) {
        pronostic.analysis.key_stats = []
      }
      if (!pronostic.analysis.missing_players) {
        pronostic.analysis.missing_players = []
      }

      // Add default bankroll if missing
      if (!pronostic.vip_tickets.safe.bankroll_percent) {
        pronostic.vip_tickets.safe.bankroll_percent = 5
      }
      if (!pronostic.vip_tickets.fun.bankroll_percent) {
        pronostic.vip_tickets.fun.bankroll_percent = 2
      }

      // V2: Ensure radar stats exist with defaults
      const defaultStats = { attack: 50, defense: 50, form: 50, morale: 50, h2h: 50 }
      if (!pronostic.analysis.home_team_stats) {
        pronostic.analysis.home_team_stats = defaultStats
      }
      if (!pronostic.analysis.away_team_stats) {
        pronostic.analysis.away_team_stats = defaultStats
      }

      // V2: Ensure H2H history exists
      if (!pronostic.analysis.h2h_history) {
        pronostic.analysis.h2h_history = {
          results: ['D', 'D', 'D', 'D', 'D'],
          home_wins: 0,
          draws: 5,
          away_wins: 0
        }
      }

      console.log('Pronostic parsed successfully')

    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Full content:', content)
      return NextResponse.json(
        { success: false, error: 'Erreur de parsing. Réessayez.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: pronostic })

  } catch (error) {
    console.error('Pronostic API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
