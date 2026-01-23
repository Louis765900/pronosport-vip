// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes publiques (pas besoin d'authentification)
const PUBLIC_ROUTES = [
  '/login',
  '/join',          // Page d'invitation VIP (accessible sans connexion)
  '/vip',           // Page de vente accessible à tous
  '/api/auth',      // Endpoints d'authentification
  '/api/cron',      // CRON jobs automatiques
  '/api/stats',     // Stats publiques pour la page VIP
];

// Routes réservées aux admins uniquement
const ADMIN_ROUTES = ['/admin'];

// Extensions de fichiers statiques à ignorer
const STATIC_FILE_REGEX = /\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|css|js|map)$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. BYPASS : Fichiers statiques et assets Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    STATIC_FILE_REGEX.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. BYPASS : Routes publiques
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`) || pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 3. AUTHENTIFICATION : Vérifier la session
  const sessionCookie = request.cookies.get('vip_session');
  const userRole = request.cookies.get('user_role')?.value;

  if (!sessionCookie) {
    // Pas de session -> Redirection vers login
    console.log(`[MIDDLEWARE] Accès refusé (no session): ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. AUTORISATION ADMIN : Protection des routes /admin
  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute) {
    if (userRole !== 'admin') {
      // Utilisateur non-admin tentant d'accéder à /admin
      console.log(`[MIDDLEWARE] Accès admin refusé - Role: ${userRole || 'undefined'}`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 5. TOUT EST OK : Laisser passer
  return NextResponse.next();
}

// Configuration du matcher
export const config = {
  matcher: [
    // Match toutes les routes sauf les fichiers statiques Next.js
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
