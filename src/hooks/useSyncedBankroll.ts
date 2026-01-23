'use client'

import { useState, useEffect, useCallback } from 'react'
import { ServerBet } from '@/types'

interface SyncedBankrollState {
  bets: ServerBet[]
  bankroll: number
  stats: {
    total: number
    won: number
    lost: number
    pending: number
    winRate: number
    profit: number
  }
  isLoading: boolean
  error: string | null
  lastSyncedAt: string | null
}

const DEFAULT_STATE: SyncedBankrollState = {
  bets: [],
  bankroll: 100,
  stats: {
    total: 0,
    won: 0,
    lost: 0,
    pending: 0,
    winRate: 0,
    profit: 0
  },
  isLoading: false,
  error: null,
  lastSyncedAt: null
}

export function useSyncedBankroll() {
  const [state, setState] = useState<SyncedBankrollState>(DEFAULT_STATE)

  // Charger les paris du serveur
  const fetchBets = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/user/bets')

      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Non connecte' }))
          return
        }
        throw new Error('Erreur lors du chargement des paris')
      }

      const data = await response.json()

      setState(prev => ({
        ...prev,
        bets: data.bets || [],
        bankroll: data.bankroll || 100,
        stats: data.stats || DEFAULT_STATE.stats,
        isLoading: false,
        lastSyncedAt: new Date().toISOString()
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      console.error('[SyncedBankroll] Fetch error:', errorMessage)
    }
  }, [])

  // Charger au montage
  useEffect(() => {
    fetchBets()
  }, [fetchBets])

  // Placer un nouveau pari
  const placeBet = useCallback(async (betData: Partial<ServerBet>): Promise<ServerBet | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/user/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(betData)
      })

      if (!response.ok) {
        throw new Error('Erreur lors du placement du pari')
      }

      const data = await response.json()

      // Rafraichir les paris
      await fetchBets()

      return data.bet

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      console.error('[SyncedBankroll] Place bet error:', errorMessage)
      return null
    }
  }, [fetchBets])

  // Mettre a jour le statut d'un pari
  const updateBetStatus = useCallback(async (betId: string, status: 'pending' | 'won' | 'lost'): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/user/bets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId, status })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise a jour du pari')
      }

      // Rafraichir les paris
      await fetchBets()

      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      console.error('[SyncedBankroll] Update bet error:', errorMessage)
      return false
    }
  }, [fetchBets])

  // Supprimer un pari
  const deleteBet = useCallback(async (betId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/user/bets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betId })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du pari')
      }

      // Rafraichir les paris
      await fetchBets()

      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }))
      console.error('[SyncedBankroll] Delete bet error:', errorMessage)
      return false
    }
  }, [fetchBets])

  // Obtenir les paris par statut
  const getBetsByStatus = useCallback((status: 'pending' | 'won' | 'lost' | 'all') => {
    if (status === 'all') return state.bets
    return state.bets.filter(bet => bet.status === status)
  }, [state.bets])

  // Calculer le ROI
  const calculateROI = useCallback(() => {
    const initialBankroll = 100
    return ((state.bankroll - initialBankroll) / initialBankroll) * 100
  }, [state.bankroll])

  // Obtenir l'historique de la bankroll pour les graphiques
  const getBankrollHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/bankroll')
      if (!response.ok) return []
      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('[SyncedBankroll] Bankroll history error:', error)
      return []
    }
  }, [])

  return {
    ...state,
    fetchBets,
    placeBet,
    updateBetStatus,
    deleteBet,
    getBetsByStatus,
    calculateROI,
    getBankrollHistory,
    roi: calculateROI()
  }
}
