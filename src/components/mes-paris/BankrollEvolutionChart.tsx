'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface BankrollDataPoint {
  date: string
  bankroll: number
}

export default function BankrollEvolutionChart() {
  const [data, setData] = useState<BankrollDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/stats/bankroll')
        if (response.ok) {
          const result = await response.json()
          // Les donnees viennent en ordre inverse (plus recent en premier)
          // On les inverse pour l'affichage chronologique
          const sortedData = Array.isArray(result) ? [...result].reverse() : []
          setData(sortedData)
        }
      } catch (error) {
        console.error('Error fetching bankroll data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse bg-dark-600 rounded-lg w-full h-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-white/50">
        Aucune donnee disponible
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      const initialValue = 100
      const change = value - initialValue
      const changePercent = ((change / initialValue) * 100).toFixed(1)

      return (
        <div className="bg-dark-800 border border-white/20 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white/70 text-xs mb-1">{formatDate(label)}</p>
          <p className="text-neon-green font-bold text-lg">{value.toFixed(2)}</p>
          <p className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Calculer le min et max pour le domaine Y
  const values = data.map(d => d.bankroll)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const padding = (maxValue - minValue) * 0.1 || 10
  const yMin = Math.floor(minValue - padding)
  const yMax = Math.ceil(maxValue + padding)

  // Determiner si on est en profit ou perte
  const lastValue = data[data.length - 1]?.bankroll || 100
  const isProfit = lastValue >= 100

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorBankroll" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isProfit ? '#39ff14' : '#ef4444'}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isProfit ? '#39ff14' : '#ef4444'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#4a5568' }}
          />
          <YAxis
            domain={[yMin, yMax]}
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#4a5568' }}
            tickFormatter={(value) => value.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="bankroll"
            stroke={isProfit ? '#39ff14' : '#ef4444'}
            strokeWidth={2}
            fill="url(#colorBankroll)"
            animationDuration={1000}
            dot={false}
            activeDot={{
              r: 6,
              fill: isProfit ? '#39ff14' : '#ef4444',
              stroke: '#1a1a1a',
              strokeWidth: 2
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
