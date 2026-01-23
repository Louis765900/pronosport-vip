import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Pronosport VIP - Pronostics Football Intelligents',
  description: 'Analyses et pronostics de football en temps réel propulsés par l\'intelligence artificielle',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Récupération des cookies côté serveur
  const cookieStore = cookies()
  const session = cookieStore.get('vip_session')?.value
  const userRole = cookieStore.get('user_role')?.value as 'admin' | 'vip' | 'free' | undefined

  const isLoggedIn = !!session
  const isAdmin = userRole === 'admin'

  return (
    <html lang="fr">
      <body className="font-sans antialiased text-white bg-gray-950">
        <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} userRole={userRole} />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
