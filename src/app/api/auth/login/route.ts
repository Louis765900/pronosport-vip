// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 15 * 60; // 15 minutes

// Génère un token de session unique
function generateToken(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

// Options des cookies
const getCookieOptions = (httpOnly: boolean = true) => ({
  httpOnly,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 jours
  path: '/',
});

function buildSuccessResponse(role: string, email: string, redirect: string) {
  const sessionToken = generateToken(role);
  const response = NextResponse.json({ success: true, role, email, redirect });
  response.cookies.set('vip_session', sessionToken, getCookieOptions(true));
  response.cookies.set('user_role', role, getCookieOptions(true));
  response.cookies.set('user_email', email, getCookieOptions(true));
  return response;
}

/**
 * POST - Connexion
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminSecret = process.env.ADMIN_SECRET;

    // ═══════════════════════════════════════════
    // CAS 1 : ADMIN (Master Password) — pas de rate limit
    // ═══════════════════════════════════════════
    if (adminSecret && password === adminSecret) {
      console.log(`[AUTH] Admin login: ${normalizedEmail}`);
      return buildSuccessResponse('admin', normalizedEmail, '/admin');
    }

    // ═══════════════════════════════════════════
    // RATE LIMITING : max 5 tentatives / 15 min
    // ═══════════════════════════════════════════
    let redis: ReturnType<typeof getRedis> | null = null;
    try {
      redis = getRedis();
      const attemptKey = `login_attempts:${normalizedEmail}`;
      const attempts = await redis.incr(attemptKey);
      if (attempts === 1) {
        await redis.expire(attemptKey, LOGIN_WINDOW_SECONDS);
      }
      if (attempts > LOGIN_MAX_ATTEMPTS) {
        console.warn(`[AUTH] Rate limit atteint pour ${normalizedEmail} (${attempts} tentatives)`);
        return NextResponse.json(
          { error: `Trop de tentatives. Réessayez dans 15 minutes.` },
          { status: 429 }
        );
      }
    } catch (redisError) {
      console.error('[AUTH] Erreur rate limit Redis:', redisError);
      // Si Redis échoue, on continue sans rate limit pour ne pas bloquer les utilisateurs légitimes
    }

    // ═══════════════════════════════════════════
    // CAS 2 : UTILISATEURS REDIS (comptes réels)
    // ═══════════════════════════════════════════
    if (redis) {
      try {
        const userRaw = await redis.get(`user:${normalizedEmail}`);
        if (userRaw) {
          const user = typeof userRaw === 'string' ? JSON.parse(userRaw) : userRaw as Record<string, string>;
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (isPasswordValid) {
            // Connexion réussie : réinitialiser le compteur
            await redis.del(`login_attempts:${normalizedEmail}`);
            console.log(`[AUTH] Redis login: ${normalizedEmail}`);
            return buildSuccessResponse(user.role || 'vip', normalizedEmail, '/');
          }
        }
      } catch (redisError) {
        console.error('[AUTH] Erreur Redis lecture user:', redisError);
      }
    }

    // ═══════════════════════════════════════════
    // CAS 3 & 4 : Comptes démo (variables d'env)
    // ═══════════════════════════════════════════
    if (process.env.ENABLE_DEMO_ACCOUNTS === 'true') {
      if (normalizedEmail === 'membre@pronosport.vip' && password === 'membre123') {
        console.log(`[AUTH] Demo VIP login`);
        return buildSuccessResponse('vip', normalizedEmail, '/');
      }
      if (normalizedEmail === 'free@pronosport.vip' && password === 'free123') {
        console.log(`[AUTH] Demo Free login`);
        return buildSuccessResponse('free', normalizedEmail, '/');
      }
    }

    // ═══════════════════════════════════════════
    // ÉCHEC : Identifiants incorrects
    // ═══════════════════════════════════════════
    console.log(`[AUTH] Échec connexion: ${normalizedEmail}`);
    return NextResponse.json(
      { error: 'Identifiants incorrects' },
      { status: 401 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[AUTH] Error:', errorMessage);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET - Vérifier la session actuelle
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('vip_session')?.value;
    const role = cookieStore.get('user_role')?.value;

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, role: role || 'unknown' });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

/**
 * DELETE - Déconnexion
 */
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true, message: 'Déconnexion réussie' });
    response.cookies.set('vip_session', '', { maxAge: 0, path: '/' });
    response.cookies.set('user_role', '', { maxAge: 0, path: '/' });
    response.cookies.set('user_email', '', { maxAge: 0, path: '/' });
    console.log('[AUTH] User logged out');
    return response;
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la déconnexion' }, { status: 500 });
  }
}
