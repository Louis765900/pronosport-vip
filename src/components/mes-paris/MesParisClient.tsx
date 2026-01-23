'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Trophy,
  Clock,
  Bell,
  BellOff,
  RefreshCw,
  PieChart,
  BarChart3
} from 'lucide-react'
import { useSyncedBankroll } from '@/hooks/useSyncedBankroll'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import BetsList from './BetsList'
import WinLossChart from './WinLossChart'
import ProfitByTypeChart from './ProfitByTypeChart'
import BankrollEvolutionChart from './BankrollEvolutionChart'

interface MesParisClientProps {
  userEmail: string
}

export default function MesParisClient({ userEmail }: MesParisClientProps) {
  const {
    bets,
    bankroll,
    stats,
    isLoading,
    error,
    fetchBets,
    roi
  } = useSyncedBankroll()

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    toggle: togglePush
  } = usePushNotifications()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchBets()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Titre et actions */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="w-6 h-6 text-neon-green" />
              Mes Paris
            </h1>
            <p className="text-sm text-white/60 mt-1">{userEmail}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton Notifications */}
            {pushSupported && (
              <button
                onClick={togglePush}
                disabled={pushLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  pushSubscribed
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                    : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                }`}
              >
                {pushLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : pushSubscribed ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {pushSubscribed ? 'Notifs actives' : 'Activer notifs'}
                </span>
              </button>
            )}

            {/* Bouton Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <motion.div
        className="max-w-7xl mx-auto px-4 pb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Erreur - demande de reconnexion si non connecte */}
        {error && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
          >
            <p className="text-yellow-400 font-medium mb-2">Session expirée</p>
            <p className="text-white/70 text-sm mb-3">
              Veuillez vous déconnecter et vous reconnecter pour activer les nouvelles fonctionnalités.
            </p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green text-dark-900 rounded-lg font-medium text-sm hover:bg-neon-green/90 transition-colors"
            >
              Se reconnecter
            </a>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          {/* Bankroll */}
          <div className="bg-dark-700 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Wallet className="w-4 h-4" />
              Bankroll
            </div>
            <div className="text-2xl font-bold text-neon-green">
              {bankroll.toFixed(2)}
            </div>
          </div>

          {/* Profit */}
          <div className="bg-dark-700 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <TrendingUp className="w-4 h-4" />
              Profit
            </div>
            <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)}
            </div>
            <div className={`text-xs ${roi >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
              ROI: {roi.toFixed(1)}%
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-dark-700 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Trophy className="w-4 h-4" />
              Win Rate
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.winRate}%
            </div>
            <div className="text-xs text-white/50">
              {stats.won}W / {stats.lost}L
            </div>
          </div>

          {/* En cours */}
          <div className="bg-dark-700 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Clock className="w-4 h-4" />
              En cours
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats.pending}
            </div>
            <div className="text-xs text-white/50">
              Total: {stats.total} paris
            </div>
          </div>
        </motion.div>

        {/* Graphiques */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
        >
          {/* Evolution Bankroll */}
          <div className="bg-dark-700 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-green" />
              Evolution de la Bankroll
            </h3>
            <BankrollEvolutionChart />
          </div>

          {/* Win/Loss Pie */}
          <div className="bg-dark-700 rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-neon-green" />
              Repartition Gains/Pertes
            </h3>
            <WinLossChart wins={stats.won} losses={stats.lost} pending={stats.pending} />
          </div>
        </motion.div>

        {/* Profit par type */}
        <motion.div
          variants={itemVariants}
          className="bg-dark-700 rounded-xl p-4 border border-white/10 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-neon-green" />
            Profit par Type de Ticket
          </h3>
          <ProfitByTypeChart bets={bets} />
        </motion.div>

        {/* Liste des paris */}
        <motion.div variants={itemVariants}>
          <BetsList bets={bets} isLoading={isLoading} />
        </motion.div>
      </motion.div>
    </div>
  )
}
