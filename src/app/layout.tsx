import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { Suspense } from 'react'
import { NavbarWrapper } from '@/components/NavbarWrapper'
import { LegalFooter } from '@/components/LegalFooter'
import { AgeVerificationPopup } from '@/components/AgeVerificationPopup'
import { BankrollSetupPopup } from '@/components/BankrollSetupPopup'
import { CookieBanner } from '@/components/CookieBanner'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Pour les encoches iPhone
  themeColor: '#F59E0B',
}

export const metadata: Metadata = {
  title: 'PronoScope — L\'élite du Pronostic',
  description: 'Analyses et pronostics de football en temps reel par IA. Jeu responsable - Interdit aux mineurs.',
  manifest: '/manifest.json',

  // PWA iOS
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PronoScope',
    startupImage: [
      {
        url: '/splash-640x1136.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash-750x1334.png',
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
      {
        url: '/splash-1242x2208.png',
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash-1125x2436.png',
        media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      {
        url: '/splash-1284x2778.png',
        media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },

  // Icones
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Open Graph
  openGraph: {
    title: 'PronoScope - Pronostics Football',
    description: 'Analyses professionnelles et pronostics par IA. Jeu responsable.',
    siteName: 'PronoScope',
    type: 'website',
    locale: 'fr_FR',
  },

  // Autres meta
  formatDetection: {
    telephone: false,
  },

  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'msapplication-TileColor': '#0a0a0a',
    'msapplication-tap-highlight': 'no',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Recuperation des cookies cote serveur
  const cookieStore = cookies()
  const session = cookieStore.get('vip_session')?.value
  const userRole = cookieStore.get('user_role')?.value as 'admin' | 'vip' | 'free' | undefined

  const isLoggedIn = !!session
  const isAdmin = userRole === 'admin'

  return (
    <html lang="fr" className="dark">
      <head>
        {/* Meta PWA supplementaires pour iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PronoScope" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Splash screens iOS */}
        <link rel="apple-touch-startup-image" href="/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" />

        {/* PWA Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#F59E0B" />

        {/* Empêcher le zoom sur double-tap iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans antialiased text-white bg-gray-950 overscroll-none">
        <Suspense fallback={null}>
          <NavbarWrapper isLoggedIn={isLoggedIn} isAdmin={isAdmin} userRole={userRole} />
        </Suspense>
        <main className="min-h-screen pb-safe">
          {children}
        </main>
        <LegalFooter />
        <AgeVerificationPopup />
        <BankrollSetupPopup />
        <CookieBanner />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[App] SW registered:', registration.scope);

                      // Ecouter les mises a jour
                      registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              // Nouvelle version disponible
                              if (confirm('Une nouvelle version est disponible. Mettre a jour ?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                              }
                            }
                          });
                        }
                      });
                    })
                    .catch(function(error) {
                      console.log('[App] SW registration failed:', error);
                    });
                });

                // Detecter le mode standalone (PWA installee)
                if (window.matchMedia('(display-mode: standalone)').matches) {
                  document.body.classList.add('pwa-standalone');
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
