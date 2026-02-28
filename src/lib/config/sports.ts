// ==========================================
// SPORTS CONFIG - Source unique de vérité
// ==========================================

export type SportId =
  | 'football'
  | 'basketball'
  | 'baseball'
  | 'hockey'
  | 'rugby'
  | 'afl'
  | 'handball'
  | 'volleyball'
  | 'mma'
  | 'f1'
  | 'nfl'
  | 'nba'

export interface SportConfig {
  id: SportId
  label: string
  emoji: string
  apiHost: string
  apiVersion: string
  endpoint: string
  color: string
}

export const SPORTS: SportConfig[] = [
  {
    id: 'football',
    label: 'Football',
    emoji: '⚽',
    apiHost: 'v3.football.api-sports.io',
    apiVersion: 'v3',
    endpoint: 'fixtures',
    color: '#f59e0b',
  },
  {
    id: 'basketball',
    label: 'Basketball',
    emoji: '🏀',
    apiHost: 'v1.basketball.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#f97316',
  },
  {
    id: 'nba',
    label: 'NBA',
    emoji: '🏀',
    apiHost: 'v1.basketball.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#c2410c',
  },
  {
    id: 'baseball',
    label: 'Baseball',
    emoji: '⚾',
    apiHost: 'v1.baseball.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#22c55e',
  },
  {
    id: 'hockey',
    label: 'Hockey',
    emoji: '🏒',
    apiHost: 'v1.hockey.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#3b82f6',
  },
  {
    id: 'rugby',
    label: 'Rugby',
    emoji: '🏉',
    apiHost: 'v1.rugby.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#8b5cf6',
  },
  {
    id: 'afl',
    label: 'AFL',
    emoji: '🦘',
    apiHost: 'v1.afl.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#ef4444',
  },
  {
    id: 'handball',
    label: 'Handball',
    emoji: '🤾',
    apiHost: 'v1.handball.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#06b6d4',
  },
  {
    id: 'volleyball',
    label: 'Volleyball',
    emoji: '🏐',
    apiHost: 'v1.volleyball.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#84cc16',
  },
  {
    id: 'mma',
    label: 'MMA',
    emoji: '🥊',
    apiHost: 'v1.mma.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'events',
    color: '#dc2626',
  },
  {
    id: 'f1',
    label: 'Formule 1',
    emoji: '🏎️',
    apiHost: 'v1.formula-1.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'races',
    color: '#e11d48',
  },
  {
    id: 'nfl',
    label: 'NFL',
    emoji: '🏈',
    apiHost: 'v1.nfl.api-sports.io',
    apiVersion: 'v1',
    endpoint: 'games',
    color: '#1d4ed8',
  },
]

export const DEFAULT_SPORT: SportId = 'football'

export function getSportConfig(id: SportId): SportConfig {
  return SPORTS.find(s => s.id === id) ?? SPORTS[0]
}

// ── Configuration UI par sport (rendu adaptatif dans PronosticResult) ──

export interface SportUIConfig {
  showBTTS: boolean
  showOverGoals: boolean
  showScoreExact: boolean
  predictionLabel: string
  selection1Label: string
  selection2Label: string
  drawPossible: boolean
  scoreUnit: string
  statsLabels: [string, string, string, string, string]
  showMissingPlayers: boolean
  contextLabel: string
}

const SPORT_UI_CONFIGS: Record<SportId, SportUIConfig> = {
  football: {
    showBTTS: true,
    showOverGoals: true,
    showScoreExact: true,
    predictionLabel: 'Résultat final (1N2)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: true,
    scoreUnit: 'buts',
    statsLabels: ['Attaque', 'Défense', 'Forme', 'Moral', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH FOOTBALL',
  },
  basketball: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Victoire (Moneyline)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: false,
    scoreUnit: 'points',
    statsLabels: ['Attaque', 'Défense', 'Forme', 'Impact', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH BASKETBALL',
  },
  nba: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Victoire NBA (Moneyline)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: false,
    scoreUnit: 'points',
    statsLabels: ['Attaque', 'Défense', 'Forme', 'Impact', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH NBA',
  },
  f1: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: false,
    predictionLabel: 'Vainqueur de la course',
    selection1Label: 'Pilote favori',
    selection2Label: 'Challengers',
    drawPossible: false,
    scoreUnit: 'N/A',
    statsLabels: ['Vitesse pure', 'Stratégie', 'Forme', 'Fiabilité', 'Circuit'],
    showMissingPlayers: false,
    contextLabel: 'GRAND PRIX F1',
  },
  mma: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: false,
    predictionLabel: 'Vainqueur du combat',
    selection1Label: 'Fighter A',
    selection2Label: 'Fighter B',
    drawPossible: false,
    scoreUnit: 'N/A',
    statsLabels: ['Frappes', 'Défense', 'Forme', 'Condition', 'H2H'],
    showMissingPlayers: false,
    contextLabel: 'COMBAT MMA',
  },
  rugby: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Résultat final',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: true,
    scoreUnit: 'points',
    statsLabels: ['Attaque', 'Défense', 'Forme', 'Physique', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH RUGBY',
  },
  handball: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Résultat final (1N2)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: true,
    scoreUnit: 'buts',
    statsLabels: ['Attaque', 'Défense', 'Forme', 'Gardien', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH HANDBALL',
  },
  volleyball: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Victoire (sets)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: false,
    scoreUnit: 'sets',
    statsLabels: ['Service', 'Réception', 'Forme', 'Moral', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH VOLLEYBALL',
  },
  hockey: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Victoire (OT/TB inclus)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: false,
    scoreUnit: 'buts',
    statsLabels: ['Attaque', 'Gardien', 'Forme', 'Power Play', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH HOCKEY',
  },
  baseball: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Victoire (Moneyline)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: false,
    scoreUnit: 'courses',
    statsLabels: ['Attaque', 'Lanceur', 'Forme', 'Bullpen', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH BASEBALL',
  },
  nfl: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Victoire (Moneyline)',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: false,
    scoreUnit: 'points',
    statsLabels: ['Attaque', 'Défense', 'QB Rating', 'Forme', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH NFL',
  },
  afl: {
    showBTTS: false,
    showOverGoals: false,
    showScoreExact: true,
    predictionLabel: 'Victoire',
    selection1Label: 'Domicile',
    selection2Label: 'Extérieur',
    drawPossible: false,
    scoreUnit: 'points',
    statsLabels: ['Attaque', 'Défense', 'Milieu', 'Forme', 'H2H'],
    showMissingPlayers: true,
    contextLabel: 'MATCH AFL',
  },
}

export function getSportUIConfig(id: SportId): SportUIConfig {
  return SPORT_UI_CONFIGS[id] ?? SPORT_UI_CONFIGS.football
}
