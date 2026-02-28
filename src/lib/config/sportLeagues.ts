// ==========================================
// SPORT LEAGUES - Filtres par sport
// ==========================================

import { SportId } from './sports'

export interface LeagueFilter {
  id: string
  name: string
  icon: string
}

export const SPORT_LEAGUES: Record<SportId, LeagueFilter[]> = {
  football: [
    { id: 'all', name: 'Toutes', icon: '⚽' },
    { id: 'champions-league', name: 'Champions League', icon: '🏆' },
    { id: 'ligue-1', name: 'Ligue 1', icon: '🇫🇷' },
    { id: 'premier-league', name: 'Premier League', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'la-liga', name: 'La Liga', icon: '🇪🇸' },
    { id: 'serie-a', name: 'Serie A', icon: '🇮🇹' },
    { id: 'bundesliga', name: 'Bundesliga', icon: '🇩🇪' },
    { id: 'europa-league', name: 'Europa League', icon: '🌍' },
  ],
  basketball: [
    { id: 'all', name: 'Toutes', icon: '🏀' },
    { id: 'nba', name: 'NBA', icon: '🇺🇸' },
    { id: 'euroleague', name: 'EuroLeague', icon: '🇪🇺' },
    { id: 'pro-a', name: 'Pro A', icon: '🇫🇷' },
    { id: 'ncaa', name: 'NCAA', icon: '🎓' },
  ],
  nba: [
    { id: 'all', name: 'Toutes', icon: '🏀' },
    { id: 'nba', name: 'NBA', icon: '🇺🇸' },
    { id: 'nba-playoffs', name: 'NBA Playoffs', icon: '🏆' },
  ],
  baseball: [
    { id: 'all', name: 'Toutes', icon: '⚾' },
    { id: 'mlb', name: 'MLB', icon: '🇺🇸' },
    { id: 'npb', name: 'NPB (Japon)', icon: '🇯🇵' },
    { id: 'kkl', name: 'KBO (Corée)', icon: '🇰🇷' },
  ],
  hockey: [
    { id: 'all', name: 'Toutes', icon: '🏒' },
    { id: 'nhl', name: 'NHL', icon: '🇺🇸' },
    { id: 'khl', name: 'KHL', icon: '🇷🇺' },
    { id: 'shl', name: 'SHL (Suède)', icon: '🇸🇪' },
    { id: 'nla', name: 'NLA (Suisse)', icon: '🇨🇭' },
  ],
  rugby: [
    { id: 'all', name: 'Toutes', icon: '🏉' },
    { id: 'six-nations', name: 'Six Nations', icon: '🌍' },
    { id: 'top14', name: 'Top 14', icon: '🇫🇷' },
    { id: 'premiership', name: 'Premiership', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    { id: 'super-rugby', name: 'Super Rugby', icon: '🌏' },
  ],
  afl: [
    { id: 'all', name: 'Toutes', icon: '🦘' },
    { id: 'afl', name: 'AFL', icon: '🇦🇺' },
  ],
  handball: [
    { id: 'all', name: 'Toutes', icon: '🤾' },
    { id: 'champions-league', name: 'Champions League', icon: '🏆' },
    { id: 'starligue', name: 'Starligue', icon: '🇫🇷' },
    { id: 'bundesliga', name: 'Bundesliga', icon: '🇩🇪' },
    { id: 'world-championship', name: 'Championnat du Monde', icon: '🌍' },
  ],
  volleyball: [
    { id: 'all', name: 'Toutes', icon: '🏐' },
    { id: 'champions-league', name: 'Champions League', icon: '🏆' },
    { id: 'ligue-a', name: 'Ligue A', icon: '🇫🇷' },
    { id: 'serie-a1', name: 'Serie A1', icon: '🇮🇹' },
    { id: 'world-league', name: 'World League', icon: '🌍' },
  ],
  mma: [
    { id: 'all', name: 'Toutes', icon: '🥊' },
    { id: 'ufc', name: 'UFC', icon: '🇺🇸' },
    { id: 'bellator', name: 'Bellator', icon: '🥋' },
    { id: 'one-championship', name: 'ONE Championship', icon: '🌏' },
  ],
  f1: [
    { id: 'all', name: 'Toutes', icon: '🏎️' },
    { id: 'formula-1', name: 'Formule 1', icon: '🏁' },
    { id: 'formula-2', name: 'Formule 2', icon: '🏎️' },
    { id: 'formula-3', name: 'Formule 3', icon: '🏎️' },
  ],
  nfl: [
    { id: 'all', name: 'Toutes', icon: '🏈' },
    { id: 'nfl', name: 'NFL', icon: '🇺🇸' },
    { id: 'nfl-playoffs', name: 'NFL Playoffs', icon: '🏆' },
    { id: 'super-bowl', name: 'Super Bowl', icon: '🏆' },
  ],
}
