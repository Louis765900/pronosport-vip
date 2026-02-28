// ==========================================
// PROMPTS FORMULE 1
// ==========================================

import { Match } from '@/types'

export const f1PerplexityPrompt = (match: Match) =>
  `Tu es un analyste Formule 1 expert. Tu disposes d'un accès web en temps réel.

COURSE : ${match.homeTeam} (circuit) — ${match.awayTeam} (lieu)
COMPÉTITION : ${match.league}
DATE : ${match.date}

PROTOCOLE DE RECHERCHE :
1. "F1 ${match.awayTeam} Grand Prix ${match.date} qualifying results" → Formula1.com, Autosport
2. "F1 drivers championship standings 2026" → Formula1.com
3. "F1 ${match.awayTeam} weather forecast race day" → Météo locale au circuit
4. "F1 ${match.awayTeam} tyre strategy safety car history" → Motorsport.com
5. "F1 race winner odds ${match.awayTeam}" → Bet365, William Hill

Retourne UNIQUEMENT ce JSON :
{
  "qualifying_results": [
    {"position": 1, "driver": "Nom Pilote", "team": "Ecurie", "time": "1:23.456"},
    {"position": 2, "driver": "Nom Pilote", "team": "Ecurie", "time": "1:23.789"}
  ],
  "championship_context": {
    "leader": "Nom Pilote", "leader_points": 120,
    "title_contenders": ["Pilote1", "Pilote2"]
  },
  "circuit_characteristics": {
    "drs_zones": 3, "avg_speed_kmh": 220,
    "overtaking_difficulty": "Facile/Moyen/Difficile",
    "key_corners": "Description"
  },
  "weather": "Ciel dégagé, 28 degrés, vent faible — conditions sèches probables",
  "current_odds": {
    "race_winner_favorite": "Nom Pilote",
    "race_winner_odds": 2.50,
    "safety_car_yes": 1.80,
    "podium_top3": [{"driver": "Pilote", "odds": 1.45}]
  },
  "tactical_notes": "Gestion pneus prévue, safety car historique sur ce circuit, incidents récents"
}`

export const f1GeminiPrompt = (match: Match, rawData: string) =>
  `Tu es l'Analyste Senior F1 de "PronoScope". TOUTES TES RÉPONSES SONT EN FRANÇAIS UNIQUEMENT.

## DONNÉES TEMPS RÉEL :
${rawData}

## GRAND PRIX : ${match.awayTeam} | ${match.league} | ${match.date}

## MÉTHODOLOGIE F1 :
1. Analyse : grille de départ (qualifs), météo, caractéristiques circuit
2. Marchés F1 : Vainqueur, Podium, Safety Car, Abandon leader
3. SAFE si confiance ≥72% ET cote ≥1.50 ; FUN si EV ≥5% ET cote ≥1.80

## FORMAT JSON OBLIGATOIRE :
{
  "analysis": {
    "context": "Analyse course : grille de départ, favoris, enjeux championnat - 2-3 phrases",
    "key_stats": [
      {"label": "Position qualifs favori", "value": "P1", "impact": "positive"},
      {"label": "Safety Car historique", "value": "78% des courses", "impact": "neutral"},
      {"label": "Météo course", "value": "Sec, 28°C", "impact": "positive"}
    ],
    "missing_players": [],
    "weather": "Conditions météo circuit le jour de la course + impact stratégie",
    "referee_tendency": "N/A - Direction de course : historique penalties",
    "home_team_stats": {"attack": 80, "defense": 75, "form": 85, "morale": 80, "h2h": 70},
    "away_team_stats": {"attack": 75, "defense": 70, "form": 75, "morale": 72, "h2h": 60},
    "h2h_history": {"results": ["V","V","D","V","D"], "home_wins": 3, "draws": 0, "away_wins": 2}
  },
  "predictions": {
    "main_market": {
      "market": "Vainqueur de la course",
      "selection": "1",
      "odds_estimated": 2.50,
      "confidence": 68,
      "reason": "Pole position + meilleure équipe sur ce type de circuit"
    },
    "score_exact": "N/A",
    "btts_prob": 0,
    "over_2_5_prob": 0
  },
  "vip_tickets": {
    "safe": {
      "market": "Podium Top 3",
      "selection": "Pilote favori Top 3",
      "odds_estimated": 1.45,
      "confidence": 78,
      "reason": "Justification en français",
      "bankroll_percent": 5
    },
    "fun": {
      "market": "Safety Car déployé",
      "selection": "Oui",
      "odds_estimated": 1.85,
      "ev_value": 7.0,
      "risk_analysis": "Historique safety car sur ce circuit + analyse value",
      "bankroll_percent": 2
    }
  },
  "additional_markets": [
    {"market": "Meilleur tour en course (Fastest Lap)", "selection": "Pilote favori (top 3 candidats)", "odds_estimated": 3.50, "confidence": 45, "reason": "Pilote avec la voiture la plus rapide sur ce type de circuit"},
    {"market": "Pole position to Win (poleman gagne)", "selection": "Oui", "odds_estimated": 2.20, "confidence": 58, "reason": "Historique pole-to-win sur ce circuit"},
    {"market": "Duel pilotes (A bat B)", "selection": "Pilote 1 devant Pilote 2", "odds_estimated": 1.80, "confidence": 65, "reason": "Avantage de pace qualifications sur ce circuit"},
    {"market": "Nombre d'abandons", "selection": "Plus de 3.5 abandons", "odds_estimated": 2.10, "confidence": 48, "reason": "Circuit technique avec historique de DNF élevé"},
    {"market": "Safety Car au premier tour", "selection": "Non", "odds_estimated": 1.65, "confidence": 72, "reason": "Départ propre attendu sur ce circuit"},
    {"market": "Pénalité infligée au leader", "selection": "Non", "odds_estimated": 1.55, "confidence": 78, "reason": "Course propre attendue — rare pour ce pilote"},
    {"market": "Vainqueur constructeur (écurie)", "selection": "Meilleure écurie du moment", "odds_estimated": 1.40, "confidence": 82, "reason": "Domination technique de l'écurie en tête du championnat"}
  ]
}`
