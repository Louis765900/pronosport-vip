import { Suspense } from 'react'
import { Toaster } from 'sonner'
import { Header, VipConfidenceCard, DashboardClient, PredictionTracker } from '@/components'
import { DashboardSkeleton } from '@/components/LoadingSkeleton'
import { DEFAULT_SPORT } from '@/lib/config/sports'
import type { SportId } from '@/lib/config/sports'

export default function Dashboard({
  searchParams,
}: {
  searchParams?: { sport?: string }
}) {
  const sport = (searchParams?.sport ?? DEFAULT_SPORT) as SportId

  return (
    <div className="min-h-screen bg-dark-900">
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
          }
        }}
      />
      <Header />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">

        {/* VIP Confidence Card */}
        <div className="mb-8">
          <Suspense fallback={<DashboardSkeleton />}>
            <VipConfidenceCard />
          </Suspense>
        </div>

        {/* Matches + Filters */}
        <DashboardClient sport={sport} />

        {/* Performance Tracking */}
        <section className="mt-12 md:mt-16">
          <PredictionTracker variant="compact" showBadge={true} />
        </section>

      </main>
    </div>
  )
}
