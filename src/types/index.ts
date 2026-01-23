// ==========================================
// TYPES APPLICATION - PERPLEXITY ONLY
// ==========================================

export type DateFilter = 'today' | 'tomorrow' | 'day-after'

// Match simplifié retourné par Perplexity
export interface PerplexityMatch {
  id: string
  league: string
  homeTeam: string
  awayTeam: string
  time: string
  stade: string
}

// Match enrichi pour l'affichage
export interface Match {
  id: string
  league: string
  homeTeam: string
  awayTeam: string
  time: string
  stade?: string
  date: string
  // Champs API-Football
  homeTeamLogo?: string
  awayTeamLogo?: string
  leagueLogo?: string
  timestamp?: number
  status?: string
  isPriority?: boolean
}

// Groupe de matchs par ligue
export interface LeagueGroup {
  league: string
  matches: Match[]
}

// Réponse API /api/matches
export interface MatchesAPIResponse {
  success: boolean
  date: string
  total: number
  leagues: LeagueGroup[]
  error?: string
}

// ==========================================
// TYPES PRONOSTIC "LA PASSION VIP"
// ==========================================

export interface KeyStat {
  label: string
  value: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface MissingPlayer {
  team: string
  player: string
  importance: 'High' | 'Medium' | 'Low'
}

// Stats pour le Radar Chart (0-100)
export interface TeamRadarStats {
  attack: number
  defense: number
  form: number
  morale: number
  h2h: number
}

// Historique H2H (5 derniers matchs)
export type H2HResult = 'W' | 'D' | 'L' // Win, Draw, Loss (du point de vue domicile)

export interface H2HHistory {
  results: H2HResult[] // 5 derniers résultats
  home_wins: number
  draws: number
  away_wins: number
}

export interface PronosticAnalysis {
  context: string
  key_stats: KeyStat[]
  missing_players: MissingPlayer[]
  weather?: string
  referee_tendency?: string
  // Nouveaux champs V2
  home_team_stats: TeamRadarStats
  away_team_stats: TeamRadarStats
  h2h_history: H2HHistory
}

export interface MainMarketPrediction {
  selection: '1' | 'N' | '2'
  probability_percent: number
  fair_odds: number
}

export interface PronosticPredictions {
  main_market: MainMarketPrediction
  score_exact: string
  btts_prob: number
  over_2_5_prob: number
}

export interface SafeTicket {
  market: string
  selection: string
  odds_estimated: number
  confidence: number
  reason: string
  bankroll_percent: number
}

export interface FunTicket {
  market: string
  selection: string
  odds_estimated: number
  ev_value?: number
  risk_analysis: string
  bankroll_percent: number
}

export interface VIPTickets {
  safe: SafeTicket
  fun: FunTicket
}

export interface PronosticResponse {
  analysis: PronosticAnalysis
  predictions: PronosticPredictions
  vip_tickets: VIPTickets
}

export interface APIPronosticResponse {
  success: boolean
  data?: PronosticResponse
  error?: string
}

// ==========================================
// TYPES NOUVELLE ARCHITECTURE ADMIN
// ==========================================

export interface Staking {
    percentage: number;
    label: 'Prudent' | 'Standard' | 'Confiance';
}

export interface Pronostic {
    fixture_id: number;
    teams: string;
    league: string;
    market: string;
    prediction: string;
    odds: number;
    staking: Staking;
    analysis: string;
    is_vip?: boolean;
}

export interface DailyAnalysis {
    global_analysis: string;
    vip_match: Pronostic | null;
    free_matches: Pronostic[];
}


// ==========================================
// COULEURS DES LIGUES POUR PLACEHOLDERS
// ==========================================

export const LEAGUE_COLORS: Record<string, string> = {
  'Ligue 1': '#1e3a5f',
  'Premier League': '#3d195b',
  'La Liga': '#ee8707',
  'Serie A': '#024494',
  'Bundesliga': '#d20515',
  'Champions League': '#0d1e5c',
  'Europa League': '#f68e00',
  'Conference League': '#19b25b',
}

// Fonction pour générer une couleur basée sur le nom
export function getTeamColor(teamName: string): string {
  let hash = 0
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 60%, 45%)`
}

// Fonction pour obtenir les initiales
export function getTeamInitials(teamName: string): string {
  const words = teamName.split(' ')
  if (words.length === 1) {
    return teamName.substring(0, 2).toUpperCase()
  }
  return words
    .slice(0, 2)
    .map(w => w.charAt(0))
    .join('')
    .toUpperCase()
}

// ==========================================
// TYPES BANKROLL MANAGER (V2)
// ==========================================

export interface Bet {
  id: string
  matchId: string
  homeTeam: string
  awayTeam: string
  league: string
  date: string
  ticketType: 'safe' | 'fun'
  market: string
  selection: string
  odds: number
  stake: number
  potentialWin: number
  status: 'pending' | 'won' | 'lost'
  createdAt: string
  settledAt?: string
}

export interface BankrollData {
  balance: number
  initialBalance: number
  bets: Bet[]
  lastUpdated: string
}

// Calcul Kelly Criterion
export function calculateKellyStake(
  bankroll: number,
  probability: number,
  odds: number,
  fraction: number = 0.25 // Kelly fractionnaire (plus prudent)
): number {
  // Kelly = (bp - q) / b où b = odds - 1, p = probabilité de gain, q = 1 - p
  const b = odds - 1
  const p = probability / 100
  const q = 1 - p
  const kelly = (b * p - q) / b
  // Ne jamais miser plus de 10% ou moins de 0
  const adjustedKelly = Math.max(0, Math.min(kelly * fraction, 0.10))
  return Math.round(bankroll * adjustedKelly * 100) / 100
}

// ==========================================
// TYPES CHAT CONTEXTUEL (V2)
// ==========================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatRequest {
  action: 'chat'
  match: Match
  pronostic: PronosticResponse
  question: string
  history?: ChatMessage[]
}

export interface ChatResponse {
  success: boolean
  message?: string
  error?: string
}

// ==========================================
// TYPES PUSH NOTIFICATIONS
// ==========================================

export interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

export interface PushSubscriptionData {
  endpoint: string
  keys: PushSubscriptionKeys
}

export interface UserPushSubscription {
  email: string
  subscription: PushSubscriptionData
  createdAt: string
  isActive: boolean
}

// ==========================================
// TYPES PARIS UTILISATEUR (SERVER SYNC)
// ==========================================

export interface ServerBet extends Bet {
  userEmail: string
  fixtureId?: number
  verificationAttempts: number
  lastVerificationAt?: string
  perplexityVerified: boolean
}

export interface UserBetsData {
  email: string
  bets: ServerBet[]
  bankroll: number
  lastSyncedAt: string
}

// ==========================================
// TYPES NOTIFICATION PAYLOAD
// ==========================================

export interface BetNotificationPayload {
  type: 'bet_result'
  betId: string
  status: 'won' | 'lost'
  match: string
  market: string
  profit?: number
  loss?: number
}
