// src/app/api/auth/register-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// Fallback pour les variables Redis (compatibilité avec différents noms)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Vérification des variables d'environnement Redis
    if (!redisUrl || !redisToken) {
      console.error('[REGISTER-INVITE] Variables Redis manquantes');
      return NextResponse.json(
        { error: 'Configuration serveur incorrecte' },
        { status: 500 }
      );
    }

    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    const { email, password, token } = await request.json();

    // 1. Validation des champs
    if (!email || !password || !token) {
      return NextResponse.json(
        { error: 'Email, mot de passe et token requis' },
        { status: 400 }
      );
    }

    // 2. Vérification du token d'invitation
    const inviteKey = `invite:${token}`;
    const inviteData = await redis.get(inviteKey);

    if (!inviteData) {
      return NextResponse.json(
        { error: "Lien d'invitation invalide ou expiré" },
        { status: 400 }
      );
    }

    // 3. Vérification si l'email existe déjà
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await redis.get(`user:${normalizedEmail}`);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // 4. Hashage sécurisé du mot de passe (bcryptjs)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Création de l'utilisateur VIP dans Redis
    const userId = uuidv4();
    const userData = {
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'vip',
      createdAt: new Date().toISOString(),
      invitedBy: 'golden-ticket',
      inviteToken: token,
    };

    await redis.set(`user:${normalizedEmail}`, userData);

    // 6. Suppression du token (usage unique = burn)
    await redis.del(inviteKey);

    // 7. Création de la session
    const sessionId = uuidv4();
    const sessionData = {
      userId: userId,
      email: normalizedEmail,
      role: 'vip',
      createdAt: new Date().toISOString(),
    };

    // Session valide 30 jours (2592000 secondes)
    await redis.set(`session:${sessionId}`, sessionData, { ex: 2592000 });

    console.log(`[REGISTER-INVITE] Nouvel utilisateur VIP créé: ${normalizedEmail}`);

    // 8. Préparation de la réponse avec cookies
    const response = NextResponse.json({
      success: true,
      message: 'Compte VIP créé avec succès',
      user: {
        id: userId,
        email: normalizedEmail,
        role: 'vip',
      },
    });

    // 9. Configuration des cookies de session
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      path: '/',
    };

    response.cookies.set('vip_session', sessionId, cookieOptions);
    response.cookies.set('user_role', 'vip', {
      ...cookieOptions,
      httpOnly: false, // Accessible côté client pour le middleware
    });

    return response;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[REGISTER-INVITE] Erreur:', errorMessage);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
