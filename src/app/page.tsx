import { Metadata } from 'next';
import { generateMetadata } from '@/lib/config/seo';
import { OrganizationSchema, WebsiteSchema } from '@/components/seo/StructuredData';
import { HeroSection } from '@/components/marketing/Hero';
import { StatsOverview } from '@/components/marketing/StatsOverview';
import { TrustSection } from '@/components/marketing/TrustBadges';
import { TestimonialsSection } from '@/components/marketing/Testimonials';
import { HowItWorksSection } from '@/components/marketing/HowItWorks';
import { RecentResults } from '@/components/marketing/RecentResults';
import { FinalCTA } from '@/components/marketing/FinalCTA';
import { IntroStatement } from '@/components/marketing/IntroStatement';

export const metadata: Metadata = generateMetadata({
  title: 'Pronostics Football IA Gratuits',
  description: 'Pronostics football IA gratuits et transparents. Analyses basées sur les données, pas sur l\'intuition. 57.9% de réussite, +12.4% ROI.',
  keywords: ['pronostic foot', 'analyse IA football', 'pronostic gratuit'],
  canonical: '/',
});

export default function HomePage() {
  return (
    <>
      <OrganizationSchema />
      <WebsiteSchema />

      <div className="min-h-screen bg-black overflow-x-hidden">
        {/* 1. HERO */}
        <HeroSection />

        {/* 2. INTRO STATEMENT */}
        <IntroStatement />

        {/* 3. STATS GLOBALES */}
        <StatsOverview
          stats={{
            winRate: 57.9,
            roi: 12.4,
            totalAnalyses: 250,
          }}
        />

        {/* 4. FEATURES ALTERNÉES */}
        <TrustSection />

        {/* 5. COMMENT ÇA MARCHE */}
        <HowItWorksSection />

        {/* 6. DERNIERS RÉSULTATS */}
        <RecentResults />

        {/* 7. TÉMOIGNAGES */}
        <TestimonialsSection />

        {/* 8. CTA FINAL */}
        <FinalCTA />
      </div>
    </>
  );
}
