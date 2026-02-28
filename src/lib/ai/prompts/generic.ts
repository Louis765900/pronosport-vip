// ==========================================
// PROMPTS GÉNÉRIQUES - Rugby, Handball, Volleyball, AFL, Hockey, Baseball, NFL
// ==========================================

import { Match } from '@/types'

const SPORT_LABELS: Record<string, { term: string; unit: string; markets: string }> = {
  rugby: { term: 'rugby', unit: 'points', markets: 'Victoire, Handicap, Total points' },
  handball: { term: 'handball', unit: 'buts', markets: 'Victoire, Handicap, Total buts' },
  volleyball: { term: 'volleyball', unit: 'sets', markets: 'Victoire, Handicap sets, Total sets' },
  afl: { term: 'football australien (AFL)', unit: 'points', markets: 'Victoire, Handicap' },
  hockey: { term: 'hockey sur glace', unit: 'buts', markets: 'Victoire, Puck line (handicap), Total buts' },
  baseball: { term: 'baseball', unit: 'runs', markets: 'Victoire (moneyline), Run line (handicap), Total runs' },
  nfl: { term: 'football américain (NFL)', unit: 'points', markets: 'Victoire, Spread, Total points' },
}

export const genericPerplexityPrompt = (match: Match) => {
  const sport = SPORT_LABELS[match.sport] ?? { term: match.sport, unit: 'points', markets: 'Victoire, Handicap, Total' }
  return `Tu es un analyste ${sport.term} expert. Tu disposes d'un accès web en temps réel.

⚠️ N'invente jamais un joueur, chiffre ou fait. Si introuvable → null.

MATCH : ${match.homeTeam} vs ${match.awayTeam}
COMPÉTITION : ${match.league}
DATE : ${match.date}

PROTOCOLE DE RECHERCHE :
1. "${match.homeTeam} blessés absents ${match.date} ${sport.term}" → sources officielles, media spécialisés
2. "${match.awayTeam} blessés absents ${match.date} ${sport.term}" → mêmes sources
3. "${match.homeTeam} forme 5 derniers matchs 2025 2026" → SofaScore, sites officiels
4. "${match.awayTeam} forme 5 derniers matchs 2025 2026" → mêmes sources
5. "${match.homeTeam} ${match.awayTeam} historique confrontations" → 5 derniers matchs
6. "cotes ${match.homeTeam} ${match.awayTeam} ${match.date}" → Bet365, Unibet

Retourne UNIQUEMENT ce JSON :
{
  "injuries_suspensions": {
    "home": [{"player": "Prenom Nom", "reason": "blessure/suspension", "importance": "High/Medium/Low", "source": "source"}],
    "away": []
  },
  "recent_form": {
    "home": {"last_5": "VVDNV", "description": "Forme 2-3 mots", "scored_avg": 2.1, "conceded_avg": 1.2},
    "away": {"last_5": "DDVND", "description": "Forme 2-3 mots", "scored_avg": 1.8, "conceded_avg": 1.9}
  },
  "h2h": {
    "last_5_results": ["V", "N", "D", "V", "V"],
    "home_wins": 3, "draws": 1, "away_wins": 1,
    "summary": "Résumé des 5 dernières confrontations"
  },
  "current_odds": {
    "home_win": 1.85, "draw": 3.40, "away_win": 4.20,
    "total_over": 1.90, "handicap_home": -2.5
  },
  "ranking_context": "Position classement et enjeux des deux équipes",
  "tactical_notes": "Système de jeu et contexte particulier"
}`
}

export const genericGeminiPrompt = (match: Match, rawData: string) => {
  const sport = SPORT_LABELS[match.sport] ?? { term: match.sport, unit: 'points', markets: 'Victoire, Handicap, Total' }
  return `Tu es l'Analyste Senior ${sport.term} de "PronoScope". TOUTES TES RÉPONSES SONT EN FRANÇAIS UNIQUEMENT.

## DONNÉES TEMPS RÉEL :
${rawData}

## MATCH : ${match.homeTeam} vs ${match.awayTeam} | ${match.league} | ${match.date}

⚠️ N'invente rien. Utilise uniquement les données ci-dessus.

## MÉTHODOLOGIE :
1. Analyse tactique : absences, forme, enjeux classement
2. Marchés disponibles : ${sport.markets}
3. SAFE si confiance ≥72% ET cote ≥1.50 ; FUN si EV ≥5% ET cote ≥1.80

## FORMAT JSON OBLIGATOIRE :
{
  "analysis": {
    "context": "Analyse tactique spécifique au ${sport.term} : forme, absences, enjeux - 2-3 phrases",
    "key_stats": [
      {"label": "Forme dom. (5 derniers)", "value": "3V 1N 1D", "impact": "positive"},
      {"label": "${sport.unit} encaissés/match", "value": "1.2", "impact": "positive"},
      {"label": "Série domicile", "value": "4V consécutives", "impact": "positive"}
    ],
    "missing_players": [{"team": "Équipe", "player": "Prénom Nom", "importance": "Élevée"}],
    "weather": "Conditions de jeu / météo si applicable",
    "referee_tendency": "Arbitre + tendance si disponible",
    "home_team_stats": {"attack": 72, "defense": 68, "form": 78, "morale": 70, "h2h": 62},
    "away_team_stats": {"attack": 65, "defense": 72, "form": 60, "morale": 65, "h2h": 38},
    "h2h_history": {"results": ["V","N","D","V","V"], "home_wins": 3, "draws": 1, "away_wins": 1}
  },
  "predictions": {
    "main_market": {
      "market": "Résultat final",
      "selection": "1",
      "odds_estimated": 1.85,
      "confidence": 72,
      "reason": "Explication en français"
    },
    "score_exact": "Résultat probable",
    "btts_prob": 0,
    "over_2_5_prob": 0
  },
  "vip_tickets": {
    "safe": {
      "market": "Chance Double 1X",
      "selection": "1X",
      "odds_estimated": 1.30,
      "confidence": 75,
      "reason": "Justification en français basée sur les données réelles",
      "bankroll_percent": 5
    },
    "fun": {
      "market": "Handicap ${sport.unit}",
      "selection": "${match.homeTeam} -2.5",
      "odds_estimated": 1.95,
      "ev_value": 5.5,
      "risk_analysis": "Analyse value en français",
      "bankroll_percent": 2
    }
  }
}`
}
