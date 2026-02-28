// ==========================================
// PROMPTS MMA / UFC
// ==========================================

import { Match } from '@/types'

export const mmaPerplexityPrompt = (match: Match) =>
  `Tu es un analyste MMA expert. Tu disposes d'un accès web en temps réel.

COMBAT : ${match.homeTeam} vs ${match.awayTeam}
ÉVÉNEMENT : ${match.league}
DATE : ${match.date}

PROTOCOLE DE RECHERCHE :
1. "${match.homeTeam} MMA record stats 2025 2026" → UFC.com, Tapology, Sherdog
2. "${match.awayTeam} MMA record stats 2025 2026" → mêmes sources
3. "${match.homeTeam} vs ${match.awayTeam} odds" → DraftKings, BetMGM
4. "${match.homeTeam} ${match.awayTeam} weight cut camp" → media spécialisés MMA

Retourne UNIQUEMENT ce JSON :
{
  "fighters": {
    "home": {
      "record": "25-5-0", "last_5": "VVVDV",
      "ko_pct": 65, "sub_pct": 20, "decision_pct": 15,
      "reach_cm": 185, "recent_camp": "Équipe d'entraînement"
    },
    "away": {
      "record": "20-3-0", "last_5": "VVDVV",
      "ko_pct": 40, "sub_pct": 45, "decision_pct": 15,
      "reach_cm": 180, "recent_camp": "Équipe d'entraînement"
    }
  },
  "h2h": {
    "last_5_results": ["V", "D"], "home_wins": 1, "draws": 0, "away_wins": 1,
    "summary": "Résumé confrontations directes si disponible"
  },
  "current_odds": {
    "home_win": 1.65, "away_win": 2.30,
    "ko_tko": 2.10, "submission": 3.50, "decision": 2.80,
    "goes_distance": 2.20
  },
  "context": "Enjeux titre, classement, rivalité personnelle si applicable"
}`

export const mmaGeminiPrompt = (match: Match, rawData: string) =>
  `Tu es l'Analyste Senior MMA de "PronoScope". TOUTES TES RÉPONSES SONT EN FRANÇAIS UNIQUEMENT.

## DONNÉES TEMPS RÉEL :
${rawData}

## COMBAT : ${match.homeTeam} vs ${match.awayTeam} | ${match.league} | ${match.date}

## MÉTHODOLOGIE MMA :
1. Analyse : styles de combat, avantages physiques, palmarès récent
2. Marchés MMA : Victoire, Méthode de victoire (KO/TKO, Soumission, Décision), Distance complète
3. SAFE si confiance ≥72% ET cote ≥1.50 ; FUN si EV ≥5% ET cote ≥1.80

## FORMAT JSON OBLIGATOIRE :
{
  "analysis": {
    "context": "Analyse combat : styles, avantages, enjeux titre - 2-3 phrases",
    "key_stats": [
      {"label": "Record", "value": "25-5 (65% KO)", "impact": "positive"},
      {"label": "Allonge", "value": "+5cm avantage", "impact": "positive"},
      {"label": "Forme récente", "value": "4V 1D sur 5", "impact": "positive"}
    ],
    "missing_players": [],
    "weather": "N/A - Combat en salle",
    "referee_tendency": "Arbitre : historique arrêts + bilan sur pieds/sol",
    "home_team_stats": {"attack": 78, "defense": 65, "form": 80, "morale": 75, "h2h": 55},
    "away_team_stats": {"attack": 72, "defense": 70, "form": 72, "morale": 70, "h2h": 45},
    "h2h_history": {"results": ["V","D"], "home_wins": 1, "draws": 0, "away_wins": 1}
  },
  "predictions": {
    "main_market": {
      "market": "Victoire combat",
      "selection": "1",
      "odds_estimated": 1.65,
      "confidence": 70,
      "reason": "Avantage technique et physique détaillé"
    },
    "score_exact": "KO/TKO Round 2",
    "btts_prob": 0,
    "over_2_5_prob": 0
  },
  "vip_tickets": {
    "safe": {
      "market": "Victoire par finition",
      "selection": "${match.homeTeam} par KO/TKO ou Soumission",
      "odds_estimated": 1.80,
      "confidence": 72,
      "reason": "Justification en français",
      "bankroll_percent": 5
    },
    "fun": {
      "market": "Combat se termine avant la limite",
      "selection": "Oui - Finition avant décision",
      "odds_estimated": 1.90,
      "ev_value": 6.0,
      "risk_analysis": "Analyse value basée sur le palmarès des deux combattants",
      "bankroll_percent": 2
    }
  },
  "additional_markets": [
    {"market": "Round exact de fin", "selection": "Round 1", "odds_estimated": 3.50, "confidence": 40, "reason": "KO% élevé du combattant favori sur les premiers rounds"},
    {"market": "Méthode + Round combo", "selection": "KO/TKO au Round 1 ou 2", "odds_estimated": 4.50, "confidence": 35, "reason": "Finisseur rapide avec puissance de frappe explosive"},
    {"market": "Premier knockdown", "selection": "Oui", "odds_estimated": 2.10, "confidence": 55, "reason": "Les deux combattants ont des échanges debout fréquents"},
    {"market": "Dominant au grappling (+ de takedowns)", "selection": "${match.homeTeam}", "odds_estimated": 1.85, "confidence": 65, "reason": "Avantage lutteur reconnu + meilleur taux de takedowns"},
    {"market": "Dominant aux frappes (significant strikes)", "selection": "${match.homeTeam}", "odds_estimated": 1.75, "confidence": 68, "reason": "Avantage technique en boxe + plus grande allonge"},
    {"market": "Combat dure 2.5 rounds ou plus", "selection": "Oui", "odds_estimated": 1.95, "confidence": 58, "reason": "Style défensif du challengeur + bon menton connu"}
  ]
}`
