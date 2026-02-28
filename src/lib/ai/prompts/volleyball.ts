// ==========================================
// PROMPTS VOLLEYBALL — 10+ marchés dédiés
// ==========================================

import { Match } from '@/types'

export const volleyballPerplexityPrompt = (match: Match) =>
  `Tu es un analyste volleyball expert. Tu disposes d'un accès web en temps réel.

⚠️ N'invente jamais un joueur, chiffre ou fait. Si introuvable → null.

MATCH : ${match.homeTeam} vs ${match.awayTeam}
COMPÉTITION : ${match.league}
DATE : ${match.date}

PROTOCOLE DE RECHERCHE :
1. "${match.homeTeam} blessés absents ${match.date} volleyball" → site officiel, CEV, LNV
2. "${match.awayTeam} blessés absents ${match.date} volleyball" → mêmes sources
3. "${match.homeTeam} forme résultats sets 2025 2026" → SofaScore
4. "${match.awayTeam} forme résultats sets 2025 2026" → mêmes sources
5. "${match.homeTeam} ${match.awayTeam} historique confrontations" → 5 derniers matchs avec scores sets
6. "cotes ${match.homeTeam} ${match.awayTeam} ${match.date}" → Bet365, Unibet
7. "${match.homeTeam} aces erreurs service 2025 2026" → stats saison
8. "${match.awayTeam} aces erreurs service 2025 2026" → stats saison

Retourne UNIQUEMENT ce JSON :
{
  "injuries_suspensions": {
    "home": [{"player": "Prenom Nom", "reason": "blessure/suspension", "importance": "High/Medium/Low", "source": "source", "position": "libero/attaquant/passeur/central..."}],
    "away": []
  },
  "recent_form": {
    "home": {"last_5": "VVDNV", "description": "Forme 2-3 mots", "sets_won_avg": 2.6, "sets_lost_avg": 0.8, "points_per_set_avg": 24.2},
    "away": {"last_5": "DDVND", "description": "Forme 2-3 mots", "sets_won_avg": 2.0, "sets_lost_avg": 1.5, "points_per_set_avg": 22.8}
  },
  "h2h": {
    "last_5_results": ["V", "D", "V", "V", "D"],
    "home_wins": 3, "draws": 0, "away_wins": 2,
    "typical_sets": "3-1",
    "summary": "Résumé des 5 dernières confrontations avec scores sets"
  },
  "current_odds": {
    "home_win": 1.55, "away_win": 2.50,
    "total_sets_over_3_5": 2.10, "total_sets_under_3_5": 1.75,
    "set1_home_win": 1.60, "set1_away_win": 2.30
  },
  "serve_stats": {
    "home": {"aces_per_set": 1.8, "serve_errors_per_set": 2.2},
    "away": {"aces_per_set": 1.4, "serve_errors_per_set": 2.8}
  },
  "ranking_context": "Position classement et enjeux des deux équipes en 2025/2026",
  "tactical_notes": "Passeur titulaire, libero, système tactique 5-1 ou 6-2"
}`

export const volleyballGeminiPrompt = (match: Match, rawData: string) =>
  `Tu es l'Analyste Senior Volleyball de "PronoScope". TOUTES TES RÉPONSES SONT EN FRANÇAIS UNIQUEMENT.

## DONNÉES TEMPS RÉEL :
${rawData}

## MATCH : ${match.homeTeam} vs ${match.awayTeam} | ${match.league} | ${match.date}

⚠️ N'invente rien. Utilise uniquement les données ci-dessus.

## MÉTHODOLOGIE VOLLEYBALL :
1. Analyse : libero, passeur, attaquants extérieurs, service (aces vs erreurs)
2. Marchés volleyball : Victoire sets, Total sets, Résultat exact, Set 1, Tie-break, Aces
3. SAFE si confiance ≥72% ET cote ≥1.50 ; FUN si EV ≥5% ET cote ≥1.80
4. Pas de nul en volleyball — score final en sets (3-0, 3-1, 3-2 ou 0-3, 1-3, 2-3)

## NOMENCLATURE FRANÇAISE VOLLEYBALL :
- "Set" (pas "manche")
- "Tie-break" (5ème set)
- "Ace" (service gagnant direct)
- "Faute de service" (pas "erreur")
- "Contre" (bloc défensif)

## FORMAT JSON OBLIGATOIRE :
{
  "analysis": {
    "context": "Analyse tactique volleyball : passeur, libero, service, force en réception — 2-3 phrases",
    "key_stats": [
      {"label": "Sets gagnés/match", "value": "2.6", "impact": "positive"},
      {"label": "Aces/set", "value": "1.8", "impact": "positive"},
      {"label": "Fautes service/set", "value": "2.2", "impact": "negative"}
    ],
    "missing_players": [{"team": "Équipe", "player": "Prénom Nom", "importance": "Élevée", "position": "Libero/Passeur"}],
    "weather": "N/A - Match en salle",
    "referee_tendency": "N/A - Arbitres volleyball",
    "home_team_stats": {"attack": 78, "defense": 72, "form": 80, "morale": 75, "h2h": 60},
    "away_team_stats": {"attack": 68, "defense": 65, "form": 58, "morale": 62, "h2h": 40},
    "h2h_history": {"results": ["V","D","V","V","D"], "home_wins": 3, "draws": 0, "away_wins": 2}
  },
  "predictions": {
    "main_market": {
      "market": "Victoire (sets)",
      "selection": "1",
      "odds_estimated": 1.55,
      "confidence": 75,
      "reason": "Explication en français"
    },
    "score_exact": "3-1",
    "btts_prob": 0,
    "over_2_5_prob": 0
  },
  "vip_tickets": {
    "safe": {
      "market": "Victoire ${match.homeTeam}",
      "selection": "1",
      "odds_estimated": 1.55,
      "confidence": 75,
      "reason": "Justification en français basée sur les données",
      "bankroll_percent": 5
    },
    "fun": {
      "market": "Total sets",
      "selection": "Plus de 3.5 sets (tie-break)",
      "odds_estimated": 2.10,
      "ev_value": 5.5,
      "risk_analysis": "Analyse : matchs historiquement serrés entre ces équipes",
      "bankroll_percent": 2
    }
  },
  "additional_markets": [
    {"market": "Résultat exact en sets", "selection": "3-1", "odds_estimated": 2.80, "confidence": 52, "reason": "Scénario le plus probable : victoire en 4 sets avec légère résistance"},
    {"market": "Set 1 gagnant", "selection": "${match.homeTeam}", "odds_estimated": 1.60, "confidence": 72, "reason": "Avantage domicile marqué sur le premier set"},
    {"market": "Tie-break joué (5ème set)", "selection": "Non", "odds_estimated": 1.75, "confidence": 70, "reason": "Écart de niveau suffisant pour éviter le tie-break"},
    {"market": "Total points Set 1", "selection": "Plus de 48.5 points", "odds_estimated": 1.90, "confidence": 62, "reason": "Sets fermés typiquement serrés en début de match"},
    {"market": "Aces dans le match", "selection": "Plus de 6.5 aces", "odds_estimated": 1.85, "confidence": 65, "reason": "Moyenne combinée aces/match des deux équipes"},
    {"market": "Clean sweep (3-0)", "selection": "Oui", "odds_estimated": 3.20, "confidence": 38, "reason": "Possible mais peu probable compte tenu du niveau de l'adversaire"}
  ]
}`
