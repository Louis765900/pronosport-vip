'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface WinLossChartProps {
  wins: number
  losses: number
  pending: number
}

export default function WinLossChart({ wins, losses, pending }: WinLossChartProps) {
  const data = [
    { name: 'Gagnes', value: wins, color: '#22c55e' },
    { name: 'Perdus', value: losses, color: '#ef4444' },
    { name: 'En cours', value: pending, color: '#eab308' },
  ].filter(item => item.value > 0)

  const total = wins + losses + pending

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-white/50">
        Aucune donnee disponible
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-dark-800 border border-white/20 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-white/70 text-sm">
            {data.value} paris ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name
  }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              <span className="text-white/80 text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
