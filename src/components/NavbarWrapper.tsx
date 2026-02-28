'use client'

// ==========================================
// NAVBAR WRAPPER - Gestion état sport côté client
// ==========================================
// Lit le sport actif depuis l'URL (?sport=football) et le transmet à la Navbar.
// Séparé du layout (Server Component) pour pouvoir utiliser useSearchParams/useRouter.

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { DEFAULT_SPORT } from '@/lib/config/sports'
import type { SportId } from '@/lib/config/sports'

interface NavbarWrapperProps {
  isLoggedIn: boolean
  isAdmin: boolean
  userRole?: 'admin' | 'vip' | 'free'
}

export function NavbarWrapper({ isLoggedIn, isAdmin, userRole }: NavbarWrapperProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeSport = (searchParams.get('sport') ?? DEFAULT_SPORT) as SportId

  const handleSportChange = (sport: SportId) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sport', sport)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Navbar
      isLoggedIn={isLoggedIn}
      isAdmin={isAdmin}
      userRole={userRole}
      activeSport={activeSport}
      onSportChange={handleSportChange}
    />
  )
}

export default NavbarWrapper
