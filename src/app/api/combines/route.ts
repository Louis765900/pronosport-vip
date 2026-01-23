// src/app/api/combines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// Fallback pour les variables Redis
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

// Les combinés sont générés automatiquement par le CRON /api/cron/generate-combines
// Chaque jour à 10h UTC, le CRON génère 1 combiné SAFE et 1 combiné FUN

/**
 * GET - Récupérer tous les combinés
 */
export async function GET() {
  try {
    if (!redisUrl || !redisToken) {
      return NextResponse.json({
        combines: [],
        message: 'Les combinés seront générés automatiquement chaque jour à 10h.'
      });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    // Récupérer la liste des IDs de combinés
    const combineIds = await redis.lrange('combines:list', 0, -1);

    if (!combineIds || combineIds.length === 0) {
      return NextResponse.json({
        combines: [],
        message: 'Aucun combiné disponible. Les nouveaux combinés arrivent chaque jour à 10h.'
      });
    }

    // Récupérer chaque combiné
    const combines = [];
    for (const id of combineIds) {
      const combineRaw = await redis.get(`combine:${id}`);
      if (combineRaw) {
        const combine = typeof combineRaw === 'string' ? JSON.parse(combineRaw) : combineRaw;
        combines.push(combine);
      }
    }

    // Trier par date de création (plus récent en premier)
    combines.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Garder seulement les 10 derniers combinés
    const recentCombines = combines.slice(0, 10);

    return NextResponse.json({ combines: recentCombines });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[COMBINES] GET Error:', errorMessage);
    return NextResponse.json({ combines: [], error: errorMessage });
  }
}

/**
 * POST - Créer un nouveau combiné (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 });
    }

    const body = await request.json();
    const { type, title, cote, mise, matches, analysis, adminKey } = body;

    // Vérification admin
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    // Validation
    if (!type || !title || !cote || !mise || !matches || matches.length === 0) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    const newCombine = {
      id: uuidv4(),
      type,
      title,
      cote: parseFloat(cote),
      mise: parseFloat(mise),
      matches,
      status: 'pending',
      createdAt: new Date().toISOString(),
      analysis: analysis || null,
    };

    // Sauvegarder le combiné
    await redis.set(`combine:${newCombine.id}`, newCombine);
    await redis.lpush('combines:list', newCombine.id);

    console.log(`[COMBINES] Nouveau combiné créé: ${newCombine.id}`);

    return NextResponse.json({ success: true, combine: newCombine });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[COMBINES] POST Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * PATCH - Mettre à jour le statut d'un combiné (Admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 });
    }

    const body = await request.json();
    const { id, status, adminKey } = body;

    // Vérification admin
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    if (!id || !status || !['pending', 'won', 'lost'].includes(status)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    const combineRaw = await redis.get(`combine:${id}`);
    if (!combineRaw) {
      return NextResponse.json({ error: 'Combiné non trouvé' }, { status: 404 });
    }

    const combine = typeof combineRaw === 'string' ? JSON.parse(combineRaw) : combineRaw;
    combine.status = status;

    await redis.set(`combine:${id}`, combine);

    console.log(`[COMBINES] Statut mis à jour: ${id} -> ${status}`);

    return NextResponse.json({ success: true, combine });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[COMBINES] PATCH Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE - Supprimer un combiné (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminKey = searchParams.get('adminKey');

    // Vérification admin
    if (adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    await redis.del(`combine:${id}`);
    await redis.lrem('combines:list', 0, id);

    console.log(`[COMBINES] Combiné supprimé: ${id}`);

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[COMBINES] DELETE Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
