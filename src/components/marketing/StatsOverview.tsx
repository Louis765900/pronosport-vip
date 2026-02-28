'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatNumber, formatPercent } from '@/lib/utils/format';

interface StatsOverviewProps {
  stats?: {
    winRate: number;
    roi: number;
    totalAnalyses: number;
  };
}

function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = easeOutQuart * value;
      setCount(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, value, duration, decimals]);

  return (
    <span ref={ref}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : formatNumber(count)}{suffix}
    </span>
  );
}

const statsConfig = [
  {
    key: 'winRate',
    label: 'Taux de réussite',
    suffix: '%',
    prefix: '',
    decimals: 1,
    color: 'text-amber-400',
  },
  {
    key: 'roi',
    label: 'ROI moyen',
    suffix: '%',
    prefix: '+',
    decimals: 1,
    color: 'text-[#30D158]',
  },
  {
    key: 'totalAnalyses',
    label: 'Analyses publiées',
    suffix: '+',
    prefix: '',
    decimals: 0,
    color: 'text-white',
  },
  {
    key: 'members',
    label: 'Membres actifs',
    suffix: '+',
    prefix: '',
    decimals: 0,
    color: 'text-white',
    staticValue: 500,
  },
];

export function StatsOverview({ stats }: StatsOverviewProps) {
  const displayStats = stats || {
    winRate: 57.9,
    roi: 12.4,
    totalAnalyses: 250,
  };

  return (
    <section className="py-8 px-4 border-y border-white/[0.06]">
      <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x-0 lg:divide-x divide-white/[0.06]">
        {statsConfig.map((stat, index) => {
          const rawValue = stat.staticValue ?? displayStats[stat.key as keyof typeof displayStats] ?? 0;

          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="px-6 py-10 text-center"
            >
              <div className={`text-5xl lg:text-6xl font-bold mb-2 ${stat.color}`}>
                <AnimatedCounter
                  value={rawValue}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                  decimals={stat.decimals}
                />
              </div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-widest">
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
