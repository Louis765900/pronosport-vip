import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// Fallback pour les variables Redis (compatibilité avec différents noms)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

export async function POST(req: Request) {
  try {
    // Vérification des variables d'environnement Redis
    if (!redisUrl || !redisToken) {
      console.error('[INVITE] Variables Redis manquantes');
      return NextResponse.json(
        { error: 'Configuration Redis manquante' },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Vérification admin (optionnel pour debug)
    if (body.key !== process.env.ADMIN_SECRET) {
      // Décommente pour activer la sécurité en production
      // return NextResponse.json({ error: '⛔ Accès refusé' }, { status: 401 });
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    // 1. Génère un code unique
    const token = uuidv4();

    // 2. Stocke dans Redis (Expire dans 48h = 172800 secondes)
    await redis.set(`invite:${token}`, 'valid', { ex: 172800 });

    // 3. Construire l'URL de base via les headers (compatible Vercel)
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';

    // Fallback si host est null (cas très rare)
    const baseUrl = host
      ? `${protocol}://${host}`
      : 'https://pronosport-vip-kh2g.vercel.app';

    const link = `${baseUrl}/join?token=${token}`;

    console.log(`[INVITE] Lien généré: ${link}`);

    return NextResponse.json({ success: true, link });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[INVITE] Erreur:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
