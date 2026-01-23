import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. SÉCURITÉ : Seul l'admin peut générer
    if (body.key !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "⛔ Accès refusé" }, { status: 401 });
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL!,
      token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN!,
    });

    // 2. Génération du token unique
    const token = uuidv4();

    // 3. Stockage dans Redis (Expire dans 48h = 172800 secondes)
    // Clé : invite:{token} -> Valeur : "valid"
    await redis.set(`invite:${token}`, "valid", { ex: 172800 });

    // 4. Construction de l'URL
    const baseUrl = new URL(req.url).origin; // Récupère https://ton-site.com
    const inviteLink = `${baseUrl}/join?token=${token}`;

    return NextResponse.json({ success: true, link: inviteLink });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}