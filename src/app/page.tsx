import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { Toaster } from 'sonner'
import { Header, VipConfidenceCard, DashboardClient } from '@/components'
import { DashboardSkeleton } from '@/components/LoadingSkeleton'


export default function Dashboard() {

  return (
    <div className="min-h-screen bg-dark-900">
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff'
          }
        }}
      />
      <Header />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Hero Section */}
        <div
          className="text-center mb-6 md:mb-8"
        >
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-neon-green" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
              La Passion <span className="text-neon-green">VIP</span>
            </h1>
          </div>
          <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto px-2">
            Analyses professionnelles et pronostics VIP generes par IA.
            Tickets SAFE et FUN avec gestion de bankroll integree.
          </p>
        </div>

        <div className="my-8">
            <Suspense fallback={<DashboardSkeleton />}>
                <VipConfidenceCard />
            </Suspense>
        </div>
        
        <DashboardClient />

        {/* Footer */}
        <footer
          className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-white/10 text-center px-2"
        >
          <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
            <Trophy className="w-4 h-4 text-neon-green flex-shrink-0" />
            <span className="text-xs md:text-sm text-white/50">
              La Passion VIP - Propulse par Perplexity AI
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-white/30 max-w-lg mx-auto leading-relaxed">
            Les pronostics sont fournis a titre indicatif uniquement.
            Pariez de maniere responsable. Ne misez jamais plus que ce que vous pouvez vous permettre de perdre.
          </p>
        </footer>
      </main>

    </div>
  )
}
