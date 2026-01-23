// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Fallback pour les variables Redis (compatibilité avec différents noms)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

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

/**
 * POST - Connexion
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Validation basique
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const adminSecret = process.env.ADMIN_SECRET;
    const normalizedEmail = email.toLowerCase().trim();

    // ═══════════════════════════════════════════
    // CAS 1 : ADMIN (Master Password)
    // ═══════════════════════════════════════════
    if (adminSecret && password === adminSecret) {
      const sessionToken = generateToken('admin');

      const response = NextResponse.json({
        success: true,
        role: 'admin',
        email: normalizedEmail,
        redirect: '/admin',
      });

      response.cookies.set('vip_session', sessionToken, getCookieOptions(true));
      response.cookies.set('user_role', 'admin', getCookieOptions(false));
      response.cookies.set('user_email', normalizedEmail, getCookieOptions(false));

      console.log(`[AUTH] Admin login: ${normalizedEmail}`);
      return response;
    }

    // ═══════════════════════════════════════════
    // CAS 2 : UTILISATEURS REDIS (VIP invités)
    // ═══════════════════════════════════════════
    if (redisUrl && redisToken) {
      try {
        const redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });

        const userRaw = await redis.get(`user:${normalizedEmail}`);

        if (userRaw) {
          // Upstash peut renvoyer un objet ou une string JSON
          const user = typeof userRaw === 'string' ? JSON.parse(userRaw) : userRaw;

          // Comparaison sécurisée avec bcrypt
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (isPasswordValid) {
            const sessionToken = generateToken('vip');

            const response = NextResponse.json({
              success: true,
              role: user.role || 'vip',
              email: normalizedEmail,
              redirect: '/',
            });

            response.cookies.set('vip_session', sessionToken, getCookieOptions(true));
            response.cookies.set('user_role', user.role || 'vip', getCookieOptions(false));
            response.cookies.set('user_email', normalizedEmail, getCookieOptions(false));

            console.log(`[AUTH] Redis VIP login: ${normalizedEmail}`);
            return response;
          }
        }
      } catch (redisError) {
        console.error('[AUTH] Erreur Redis:', redisError);
        // Continue vers les fallbacks hardcodés
      }
    }

    // ═══════════════════════════════════════════
    // CAS 3 : MEMBRE VIP (Hardcodé - Fallback)
    // ═══════════════════════════════════════════
    if (normalizedEmail === 'membre@pronosport.vip' && password === 'membre123') {
      const sessionToken = generateToken('vip');

      const response = NextResponse.json({
        success: true,
        role: 'vip',
        email: normalizedEmail,
        redirect: '/',
      });

      response.cookies.set('vip_session', sessionToken, getCookieOptions(true));
      response.cookies.set('user_role', 'vip', getCookieOptions(false));
      response.cookies.set('user_email', normalizedEmail, getCookieOptions(false));

      console.log(`[AUTH] VIP login (hardcoded): ${normalizedEmail}`);
      return response;
    }

    // ═══════════════════════════════════════════
    // CAS 4 : UTILISATEUR FREE (Demo - Fallback)
    // ═══════════════════════════════════════════
    if (normalizedEmail === 'free@pronosport.vip' && password === 'free123') {
      const sessionToken = generateToken('free');

      const response = NextResponse.json({
        success: true,
        role: 'free',
        email: normalizedEmail,
        redirect: '/',
      });

      response.cookies.set('vip_session', sessionToken, getCookieOptions(true));
      response.cookies.set('user_role', 'free', getCookieOptions(false));
      response.cookies.set('user_email', normalizedEmail, getCookieOptions(false));

      console.log(`[AUTH] Free login: ${normalizedEmail}`);
      return response;
    }

    // ═══════════════════════════════════════════
    // ÉCHEC : Identifiants incorrects
    // ═══════════════════════════════════════════
    console.log(`[AUTH] Failed login attempt: ${normalizedEmail}`);
    return NextResponse.json(
      { error: 'Identifiants incorrects' },
      { status: 401 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[AUTH] Error:', errorMessage);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
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

    return NextResponse.json({
      authenticated: true,
      role: role || 'unknown',
    });

  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

/**
 * DELETE - Déconnexion
 */
export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    });

    // Supprimer les cookies en les expirant
    response.cookies.set('vip_session', '', { maxAge: 0, path: '/' });
    response.cookies.set('user_role', '', { maxAge: 0, path: '/' });
    response.cookies.set('user_email', '', { maxAge: 0, path: '/' });

    console.log('[AUTH] User logged out');
    return response;

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}
