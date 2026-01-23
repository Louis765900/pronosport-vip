// src/app/api/stats/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

// Helper pour créer la connexion Redis
function getRedis() {
    const redisUrl = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

    if (!redisUrl || !redisToken) {
        throw new Error("Variables d'environnement Redis manquantes.");
    }

    return new Redis({ url: redisUrl, token: redisToken });
}

/**
 * GET - Récupère les statistiques depuis Redis
 *
 * Retourne:
 * - winRate: pourcentage de victoires (0-100)
 * - totalPronostics: nombre total de pronostics
 * - wins: nombre de victoires
 * - losses: nombre de défaites
 * - streak: série en cours (si disponible)
 */
export async function GET() {
    try {
        const redis = getRedis();

        // Récupération des stats depuis Redis
        // On utilise mget pour une seule requête
        const [wins, total, streak, lastUpdated] = await Promise.all([
            redis.get<number>('stats:wins'),
            redis.get<number>('stats:total'),
            redis.get<number>('stats:streak'),
            redis.get<string>('stats:last_updated'),
        ]);

        // Valeurs par défaut si pas de données
        const totalPronostics = total ?? 0;
        const totalWins = wins ?? 0;
        const currentStreak = streak ?? 0;

        // Calcul du taux de réussite
        let winRate = 0;
        if (totalPronostics > 0) {
            winRate = Math.round((totalWins / totalPronostics) * 100);
        }

        // Calcul des pertes
        const losses = totalPronostics - totalWins;

        return NextResponse.json({
            success: true,
            data: {
                winRate,
                totalPronostics,
                wins: totalWins,
                losses,
                streak: currentStreak,
                lastUpdated: lastUpdated || null,
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("[STATS API] Erreur:", errorMessage);

        // En cas d'erreur, retourner des valeurs par défaut plutôt qu'une erreur 500
        // pour que le dashboard puisse s'afficher
        return NextResponse.json({
            success: false,
            error: errorMessage,
            data: {
                winRate: 0,
                totalPronostics: 0,
                wins: 0,
                losses: 0,
                streak: 0,
                lastUpdated: null,
            }
        });
    }
}

/**
 * POST - Met à jour les statistiques (Admin uniquement)
 * Body: { wins?: number, total?: number, streak?: number, secret: string }
 */
export async function POST(req: Request) {
    try {
        let body: {
            wins?: number;
            total?: number;
            streak?: number;
            secret?: string;
            increment?: { wins?: number; total?: number };
        };

        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: 'Body JSON invalide.' }, { status: 400 });
        }

        // Vérification du secret admin
        if (body.secret !== process.env.ADMIN_SECRET) {
            return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
        }

        const redis = getRedis();
        const updates: Promise<unknown>[] = [];

        // Mise à jour directe des valeurs
        if (typeof body.wins === 'number') {
            updates.push(redis.set('stats:wins', body.wins));
        }
        if (typeof body.total === 'number') {
            updates.push(redis.set('stats:total', body.total));
        }
        if (typeof body.streak === 'number') {
            updates.push(redis.set('stats:streak', body.streak));
        }

        // Incrémentation (pour ajouter un résultat)
        if (body.increment) {
            if (typeof body.increment.wins === 'number') {
                updates.push(redis.incrby('stats:wins', body.increment.wins));
            }
            if (typeof body.increment.total === 'number') {
                updates.push(redis.incrby('stats:total', body.increment.total));
            }
        }

        // Mise à jour du timestamp
        updates.push(redis.set('stats:last_updated', new Date().toISOString()));

        await Promise.all(updates);

        // Récupérer les nouvelles valeurs
        const [newWins, newTotal, newStreak] = await Promise.all([
            redis.get<number>('stats:wins'),
            redis.get<number>('stats:total'),
            redis.get<number>('stats:streak'),
        ]);

        const totalPronostics = newTotal ?? 0;
        const totalWins = newWins ?? 0;
        const winRate = totalPronostics > 0 ? Math.round((totalWins / totalPronostics) * 100) : 0;

        return NextResponse.json({
            success: true,
            message: 'Stats mises à jour.',
            data: {
                winRate,
                totalPronostics,
                wins: totalWins,
                losses: totalPronostics - totalWins,
                streak: newStreak ?? 0,
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error("[STATS API POST] Erreur:", errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
