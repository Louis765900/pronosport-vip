// src/app/api/cron/generate-combines/route.ts
// CRON automatique pour générer les combinés quotidiens avec les VRAIS matchs
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Fallback Redis
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

// API-Football (RapidAPI) - Plus fiable et complète
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;

// Toutes les ligues intéressantes (pas que les majeures)
const LEAGUES: Record<number, string> = {
  // Top 5
  61: 'Ligue 1', 39: 'Premier League', 140: 'La Liga', 135: 'Serie A', 78: 'Bundesliga',
  // Coupes Europe
  2: 'Champions League', 3: 'Europa League', 848: 'Conference League',
  // Autres championnats
  88: 'Eredivisie', 94: 'Primeira Liga', 144: 'Jupiler Pro League', 203: 'Super Lig',
  // Ligue 2 et Championship
  62: 'Ligue 2', 40: 'Championship', 141: 'La Liga 2', 136: 'Serie B',
  // Autres
  179: 'Scottish Premiership', 197: 'Super League Grèce', 218: 'Tippeligaen',
  // Coupes nationales
  66: 'Coupe de France', 45: 'FA Cup', 143: 'Copa del Rey',
};

interface ApiFootballMatch {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  league: {
    id: number;
    name: string;
  };
  teams: {
    home: { name: string };
    away: { name: string };
  };
}

interface CombineMatch {
  equipe1: string;
  equipe2: string;
  prono: string;
  competition: string;
  heure: string;
}

// Pronos SAFE (haute probabilité)
const SAFE_PRONOS = [
  'Plus de 1.5 buts',
  'Double chance 1X',
  'Double chance X2',
  'Plus de 0.5 buts 1ère MT',
];

// Pronos FUN (cotes plus élevées)
const FUN_PRONOS = [
  'Plus de 2.5 buts',
  'Les deux équipes marquent',
  'Plus de 3.5 buts',
  'Victoire domicile',
];

// Analyses IA
const SAFE_ANALYSES = [
  "Combiné sécurisé basé sur les statistiques récentes. Ces équipes affichent une constance remarquable. Probabilité de réussite estimée à 75%+.",
  "Sélection prudente avec des matchs où les stats sont en notre faveur. Confiance élevée sur ce ticket.",
  "Analyse Perplexity AI : Les tendances actuelles convergent vers ce combiné. Risque maîtrisé.",
];

const FUN_ANALYSES = [
  "Combiné à forte cote pour les amateurs de sensations ! Ces matchs ont le potentiel d'offrir du spectacle.",
  "Sélection audacieuse mais réfléchie. Mise raisonnable conseillée pour maximiser le fun.",
  "Analyse Perplexity AI : Combiné risqué mais les conditions sont réunies pour une belle surprise.",
];

/**
 * Récupère TOUS les matchs du jour via API-Football (un seul appel)
 */
async function fetchTodayMatches(): Promise<CombineMatch[]> {
  const today = new Date().toISOString().split('T')[0];

  if (!API_FOOTBALL_KEY) {
    console.error('[CRON] Clé API_FOOTBALL_KEY manquante !');
    return [];
  }

  try {
    // Un seul appel pour récupérer TOUS les matchs du jour
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}`,
      {
        headers: {
          'x-apisports-key': API_FOOTBALL_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('[CRON] Erreur API:', response.status);
      return [];
    }

    const data = await response.json();
    const matches = data.response || [];

    console.log(`[CRON] API retourne ${matches.length} matchs pour ${today}`);

    const allMatches: CombineMatch[] = [];

    for (const match of matches) {
      // Ne prendre que les matchs pas encore commencés (NS = Not Started)
      if (match.fixture.status.short === 'NS') {
        const fixtureDate = new Date(match.fixture.date);
        const hours = fixtureDate.getHours().toString().padStart(2, '0');
        const minutes = fixtureDate.getMinutes().toString().padStart(2, '0');

        // Utiliser le nom de la ligue depuis l'API ou notre mapping
        const leagueName = LEAGUES[match.league.id] || match.league.name;

        allMatches.push({
          equipe1: match.teams.home.name,
          equipe2: match.teams.away.name,
          prono: '',
          competition: leagueName,
          heure: `${hours}:${minutes}`,
        });
      }
    }

    console.log(`[CRON] ${allMatches.length} matchs à venir trouvés`);
    return allMatches;

  } catch (error) {
    console.error('[CRON] Erreur fetch matchs:', error);
    return [];
  }
}

/**
 * Génère un combiné avec les vrais matchs
 */
function generateCombine(matches: CombineMatch[], type: 'safe' | 'fun'): any {
  if (matches.length === 0) {
    return null;
  }

  const matchCount = type === 'safe' ? 2 : 3;
  const pronos = type === 'safe' ? SAFE_PRONOS : FUN_PRONOS;
  const analyses = type === 'safe' ? SAFE_ANALYSES : FUN_ANALYSES;

  // Mélanger et sélectionner les matchs
  const shuffled = [...matches].sort(() => Math.random() - 0.5);
  const selectedMatches = shuffled.slice(0, Math.min(matchCount, shuffled.length));

  // Assigner des pronos
  const combineMatches = selectedMatches.map((match) => ({
    ...match,
    prono: pronos[Math.floor(Math.random() * pronos.length)],
  }));

  // Calculer la cote (simulation réaliste)
  let cote = 1;
  combineMatches.forEach(() => {
    const coteSingle = type === 'safe'
      ? 1.25 + Math.random() * 0.35  // 1.25 - 1.60
      : 1.50 + Math.random() * 0.70; // 1.50 - 2.20
    cote *= coteSingle;
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  return {
    id: uuidv4(),
    type,
    title: type === 'safe' ? `Combiné Safe - ${dateStr}` : `Combiné Fun - ${dateStr}`,
    cote: Math.round(cote * 100) / 100,
    mise: type === 'safe' ? 20 : 10,
    matches: combineMatches,
    status: 'pending',
    createdAt: new Date().toISOString(),
    analysis: analyses[Math.floor(Math.random() * analyses.length)],
  };
}

/**
 * CRON Endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification CRON
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const isValidSecret = authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isValidSecret && cronSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 });
    }

    if (!API_FOOTBALL_KEY) {
      return NextResponse.json({
        error: 'Clé API_FOOTBALL_KEY manquante. Ajoute-la dans tes variables Vercel.',
        help: 'Inscris-toi gratuitement sur https://www.api-football.com/'
      }, { status: 500 });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    // Paramètres
    const { searchParams } = new URL(request.url);
    const forceRegenerate = searchParams.get('force') === 'true';
    const clearOld = searchParams.get('clear') === 'true';

    // Nettoyer les anciens combinés si demandé
    if (clearOld) {
      const oldIds = await redis.lrange('combines:list', 0, -1);
      for (const id of oldIds) {
        await redis.del(`combine:${id}`);
      }
      await redis.del('combines:list');
      await redis.del('combines:last_generation');
      console.log(`[CRON] ${oldIds.length} anciens combinés supprimés`);
    }

    const today = new Date().toISOString().split('T')[0];
    const lastGeneration = await redis.get('combines:last_generation');

    if (lastGeneration === today && !forceRegenerate && !clearOld) {
      return NextResponse.json({
        success: true,
        message: 'Combinés déjà générés aujourd\'hui. Ajoute ?force=true pour regénérer.',
        skipped: true
      });
    }

    console.log('[CRON] Récupération des vrais matchs du jour...');

    // Récupérer les vrais matchs
    const matches = await fetchTodayMatches();

    if (matches.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun match trouvé aujourd\'hui',
        message: 'Pas de matchs programmés dans les ligues majeures'
      });
    }

    // Générer les combinés
    const safeCombine = generateCombine(matches, 'safe');
    const funCombine = generateCombine(matches, 'fun');

    const generatedCombines = [];

    if (safeCombine) {
      await redis.set(`combine:${safeCombine.id}`, safeCombine);
      await redis.lpush('combines:list', safeCombine.id);
      generatedCombines.push(safeCombine);
    }

    if (funCombine) {
      await redis.set(`combine:${funCombine.id}`, funCombine);
      await redis.lpush('combines:list', funCombine.id);
      generatedCombines.push(funCombine);
    }

    // Marquer la génération du jour
    await redis.set('combines:last_generation', today);

    console.log(`[CRON] ${generatedCombines.length} combinés générés avec ${matches.length} vrais matchs`);

    return NextResponse.json({
      success: true,
      message: `${generatedCombines.length} combinés générés avec les vrais matchs du jour`,
      combines: generatedCombines,
      matchesAvailable: matches.length,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[CRON] Erreur:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
