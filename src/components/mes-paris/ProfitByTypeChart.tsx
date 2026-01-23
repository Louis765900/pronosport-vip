'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { ServerBet } from '@/types'

interface ProfitByTypeChartProps {
  bets: ServerBet[]
}

export default function ProfitByTypeChart({ bets }: ProfitByTypeChartProps) {
  // Calculer le profit par type de ticket
  const calculateProfit = (type: 'safe' | 'fun') => {
    return bets
      .filter(bet => bet.ticketType === type && bet.status !== 'pending')
      .reduce((total, bet) => {
        if (bet.status === 'won') {
          return total + (bet.potentialWin - bet.stake)
        } else if (bet.status === 'lost') {
          return total - bet.stake
        }
        return total
      }, 0)
  }

  const safeProfit = calculateProfit('safe')
  const funProfit = calculateProfit('fun')

  const data = [
    {
      name: 'SAFE',
      profit: Math.round(safeProfit * 100) / 100,
      color: safeProfit >= 0 ? '#22c55e' : '#ef4444',
      count: bets.filter(b => b.ticketType === 'safe').length
    },
    {
      name: 'FUN',
      profit: Math.round(funProfit * 100) / 100,
      color: funProfit >= 0 ? '#a855f7' : '#ef4444',
      count: bets.filter(b => b.ticketType === 'fun').length
    }
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-dark-800 border border-white/20 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white font-medium">Tickets {item.name}</p>
          <p className={`text-sm ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Profit: {item.profit >= 0 ? '+' : ''}{item.profit.toFixed(2)}
          </p>
          <p className="text-white/60 text-xs">
            {item.count} paris places
          </p>
        </div>
      )
    }
    return null
  }

  if (bets.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-white/50">
        Aucune donnee disponible
      </div>
    )
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" horizontal={false} />
          <XAxis
            type="number"
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value}`}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9ca3af"
            fontSize={12}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <ReferenceLine x={0} stroke="#6b7280" strokeDasharray="3 3" />
          <Bar dataKey="profit" radius={[0, 4, 4, 0]} animationDuration={800}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
