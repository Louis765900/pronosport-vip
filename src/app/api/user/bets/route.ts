import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Redis } from '@upstash/redis'
import { ServerBet, Bet } from '@/types'

export const dynamic = 'force-dynamic'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN

/**
 * GET - Recuperer les paris de l'utilisateur
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('vip_session')?.value
    const userEmail = cookieStore.get('user_email')?.value

    if (!session || !userEmail) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })

    // Recuperer les paris
    const betsRaw = await redis.get(`user:${userEmail}:bets`)
    const bets: ServerBet[] = betsRaw
      ? (typeof betsRaw === 'string' ? JSON.parse(betsRaw) : betsRaw as ServerBet[])
      : []

    // Recuperer la bankroll
    const bankrollRaw = await redis.get(`user:${userEmail}:bankroll`)
    const bankroll = bankrollRaw ? parseFloat(String(bankrollRaw)) : 100

    // Calculer les stats
    const totalBets = bets.length
    const wonBets = bets.filter(b => b.status === 'won').length
    const lostBets = bets.filter(b => b.status === 'lost').length
    const pendingBets = bets.filter(b => b.status === 'pending').length
    const winRate = totalBets > 0 ? Math.round((wonBets / (wonBets + lostBets)) * 100) || 0 : 0

    // Calculer le profit total
    let totalProfit = 0
    bets.forEach(bet => {
      if (bet.status === 'won') {
        totalProfit += bet.potentialWin - bet.stake
      } else if (bet.status === 'lost') {
        totalProfit -= bet.stake
      }
    })

    return NextResponse.json({
      success: true,
      bets,
      bankroll,
      stats: {
        total: totalBets,
        won: wonBets,
        lost: lostBets,
        pending: pendingBets,
        winRate,
        profit: Math.round(totalProfit * 100) / 100
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[USER BETS] GET error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * POST - Ajouter un nouveau pari
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('vip_session')?.value
    const userEmail = cookieStore.get('user_email')?.value

    if (!session || !userEmail) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const betData: Partial<ServerBet> = await req.json()

    if (!betData.homeTeam || !betData.awayTeam || !betData.market) {
      return NextResponse.json({ error: 'Donnees du pari incompletes' }, { status: 400 })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })

    // Creer le pari complet
    const newBet: ServerBet = {
      id: betData.id || `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId: betData.matchId || '',
      homeTeam: betData.homeTeam,
      awayTeam: betData.awayTeam,
      league: betData.league || '',
      date: betData.date || new Date().toISOString().split('T')[0],
      ticketType: betData.ticketType || 'safe',
      market: betData.market,
      selection: betData.selection || '',
      odds: betData.odds || 1.5,
      stake: betData.stake || 5,
      potentialWin: (betData.stake || 5) * (betData.odds || 1.5),
      status: 'pending',
      createdAt: new Date().toISOString(),
      userEmail: userEmail,
      fixtureId: betData.fixtureId,
      verificationAttempts: 0,
      perplexityVerified: false
    }

    // Recuperer les paris existants
    const existingRaw = await redis.get(`user:${userEmail}:bets`)
    const existingBets: ServerBet[] = existingRaw
      ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw as ServerBet[])
      : []

    // Ajouter le nouveau pari au debut
    existingBets.unshift(newBet)

    // Sauvegarder
    await redis.set(`user:${userEmail}:bets`, JSON.stringify(existingBets))

    // Enregistrer pour le tracking automatique
    await redis.set(`pending_user_bet:${newBet.id}`, JSON.stringify(newBet))

    // Mettre a jour la bankroll (deduire la mise)
    const currentBankroll = await redis.get(`user:${userEmail}:bankroll`)
    const bankroll = currentBankroll ? parseFloat(String(currentBankroll)) : 100
    await redis.set(`user:${userEmail}:bankroll`, bankroll - newBet.stake)

    console.log(`[USER BETS] New bet created for ${userEmail}: ${newBet.homeTeam} vs ${newBet.awayTeam}`)

    return NextResponse.json({ success: true, bet: newBet })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[USER BETS] POST error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * PATCH - Mettre a jour le statut d'un pari
 */
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('vip_session')?.value
    const userEmail = cookieStore.get('user_email')?.value

    if (!session || !userEmail) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { betId, status } = await req.json()

    if (!betId || !status || !['pending', 'won', 'lost'].includes(status)) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })

    // Recuperer les paris
    const existingRaw = await redis.get(`user:${userEmail}:bets`)
    const bets: ServerBet[] = existingRaw
      ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw as ServerBet[])
      : []

    // Trouver et mettre a jour le pari
    const betIndex = bets.findIndex(b => b.id === betId)
    if (betIndex === -1) {
      return NextResponse.json({ error: 'Pari non trouve' }, { status: 404 })
    }

    const bet = bets[betIndex]
    const previousStatus = bet.status

    // Mettre a jour le statut
    bets[betIndex] = {
      ...bet,
      status: status as 'pending' | 'won' | 'lost',
      settledAt: status !== 'pending' ? new Date().toISOString() : undefined,
      perplexityVerified: true
    }

    // Sauvegarder
    await redis.set(`user:${userEmail}:bets`, JSON.stringify(bets))

    // Mettre a jour la bankroll si le statut change
    if (previousStatus === 'pending' && status !== 'pending') {
      const currentBankroll = await redis.get(`user:${userEmail}:bankroll`)
      let bankroll = currentBankroll ? parseFloat(String(currentBankroll)) : 100

      if (status === 'won') {
        bankroll += bet.potentialWin
      }
      // Si perdu, la mise a deja ete deduite lors du placement

      await redis.set(`user:${userEmail}:bankroll`, bankroll)

      // Supprimer du tracking
      await redis.del(`pending_user_bet:${betId}`)
    }

    console.log(`[USER BETS] Bet ${betId} updated to ${status} for ${userEmail}`)

    return NextResponse.json({ success: true, bet: bets[betIndex] })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[USER BETS] PATCH error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * DELETE - Supprimer un pari
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('vip_session')?.value
    const userEmail = cookieStore.get('user_email')?.value

    if (!session || !userEmail) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { betId } = await req.json()

    if (!betId) {
      return NextResponse.json({ error: 'ID du pari requis' }, { status: 400 })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })

    // Recuperer les paris
    const existingRaw = await redis.get(`user:${userEmail}:bets`)
    const bets: ServerBet[] = existingRaw
      ? (typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw as ServerBet[])
      : []

    // Trouver le pari a supprimer
    const betIndex = bets.findIndex(b => b.id === betId)
    if (betIndex === -1) {
      return NextResponse.json({ error: 'Pari non trouve' }, { status: 404 })
    }

    const bet = bets[betIndex]

    // Si le pari est en cours, rembourser la mise
    if (bet.status === 'pending') {
      const currentBankroll = await redis.get(`user:${userEmail}:bankroll`)
      const bankroll = currentBankroll ? parseFloat(String(currentBankroll)) : 100
      await redis.set(`user:${userEmail}:bankroll`, bankroll + bet.stake)
      await redis.del(`pending_user_bet:${betId}`)
    }

    // Supprimer le pari
    bets.splice(betIndex, 1)
    await redis.set(`user:${userEmail}:bets`, JSON.stringify(bets))

    console.log(`[USER BETS] Bet ${betId} deleted for ${userEmail}`)

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[USER BETS] DELETE error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
