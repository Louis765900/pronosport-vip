import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';

// Fonction helper pour générer un ID de session (comme dans ton login)
function generateToken(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
}

export async function POST(req: Request) {
  try {
    const { email, password, token } = await req.json();

    // 1. Validation des champs
    if (!email || !password || !token) {
        return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL!,
      token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN!,
    });

    // 2. VÉRIFIER LE TOKEN D'INVITATION
    // On regarde si la clé "invite:..." existe dans Redis
    const isValid = await redis.get(`invite:${token}`);
    
    if (!isValid) {
        return NextResponse.json({ error: "Ce lien d'invitation est invalide ou a déjà été utilisé." }, { status: 403 });
    }

    // 3. VÉRIFIER SI L'UTILISATEUR EXISTE DÉJÀ
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await redis.get(`user:${normalizedEmail}`);
    
    if (existingUser) {
        return NextResponse.json({ error: "Cet email possède déjà un compte." }, { status: 400 });
    }

    // 4. CRÉER LE COMPTE VIP DANS REDIS
    const userData = {
        email: normalizedEmail,
        password: password, // Note: En prod, on hasherait le mot de passe ici
        role: 'vip',
        joinedAt: new Date().toISOString(),
        source: 'golden_ticket'
    };

    // On sauvegarde l'utilisateur
    await redis.set(`user:${normalizedEmail}`, JSON.stringify(userData));

    // 5. BRÛLER LE TOKEN (Usage unique)
    // On le supprime pour que personne d'autre ne puisse l'utiliser
    await redis.del(`invite:${token}`);

    // 6. CONNECTER L'UTILISATEUR DIRECTEMENT (Cookies)
    const sessionToken = generateToken('vip');
    
    cookies().set('vip_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 jours
        path: '/',
    });

    cookies().set('user_role', 'vip', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erreur Register Invite:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}