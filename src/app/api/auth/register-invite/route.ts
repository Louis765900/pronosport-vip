// src/app/api/auth/register-invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getRedis } from '@/lib/redis';
import { isValidEmail, isStrongPassword } from '@/lib/utils/validators';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const redis = getRedis();

    const { email, password, token } = await request.json();

    // 1. Validation des champs obligatoires
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // 2. Validation format email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      );
    }

    // 3. Validation force mot de passe
    const { valid: passwordValid, errors: passwordErrors } = isStrongPassword(password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: passwordErrors.join('. ') },
        { status: 400 }
      );
    }

    // 4. Si token présent, vérifier l'invitation (sinon inscription libre)
    if (token) {
      const inviteKey = `invite:${token}`;
      const inviteData = await redis.get(inviteKey);

      if (!inviteData) {
        return NextResponse.json(
          { error: "Lien d'invitation invalide ou expiré" },
          { status: 400 }
        );
      }

      // Supprimer le token d'invitation (usage unique)
      await redis.del(inviteKey);
    }

    // 5. Vérification si l'email existe déjà
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await redis.get(`user:${normalizedEmail}`);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // 6. Hashage sécurisé du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Création de l'utilisateur dans Redis
    const userId = uuidv4();
    const userData = {
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'vip',
      createdAt: new Date().toISOString(),
      invitedBy: token ? 'golden-ticket' : 'open-registration',
    };

    await redis.set(`user:${normalizedEmail}`, userData);

    // 8. Initialiser la bankroll à 100
    await redis.set(`user:${normalizedEmail}:bankroll`, 100);
    await redis.set(`user:${normalizedEmail}:bankroll:initial`, 100);

    // 9. Création de la session (7 jours)
    const sessionId = uuidv4();

    console.log(`[REGISTER] Nouvel utilisateur créé: ${normalizedEmail} (${token ? 'invitation' : 'inscription libre'})`);

    // 10. Préparation de la réponse avec cookies
    const response = NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: userId,
        email: normalizedEmail,
        role: 'vip',
      },
    });

    // 11. Configuration des cookies de session
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    };

    response.cookies.set('vip_session', sessionId, cookieOptions);
    response.cookies.set('user_role', 'vip', cookieOptions);
    response.cookies.set('user_email', normalizedEmail, cookieOptions);

    return response;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[REGISTER] Erreur:', errorMessage);
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
