import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { Redis } from '@upstash/redis'
import { UserPushSubscription } from '@/types'

export const dynamic = 'force-dynamic'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN

// Configuration VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@pronosport.vip'

/**
 * POST - Envoyer une notification push a un utilisateur
 * Securise par ADMIN_SECRET
 */
export async function POST(req: NextRequest) {
  try {
    // Verification de la cle admin
    const apiKey = req.nextUrl.searchParams.get('key')
    if (apiKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    // Verification de la configuration VAPID
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: 'Configuration VAPID manquante' }, { status: 500 })
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const { email, title, body, url, betId } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })

    // Recuperer l'abonnement de l'utilisateur
    const pushDataRaw = await redis.get(`push:${email}`)

    if (!pushDataRaw) {
      console.log(`[PUSH] No subscription found for ${email}`)
      return NextResponse.json({ error: 'Aucun abonnement trouve', sent: false }, { status: 404 })
    }

    const pushData: UserPushSubscription = typeof pushDataRaw === 'string'
      ? JSON.parse(pushDataRaw)
      : pushDataRaw as UserPushSubscription

    if (!pushData.isActive) {
      return NextResponse.json({ error: 'Abonnement inactif', sent: false }, { status: 404 })
    }

    // Preparer le payload
    const payload = JSON.stringify({
      title: title || 'Pronosport VIP',
      body: body || 'Nouvelle notification',
      url: url || '/mes-paris',
      betId: betId
    })

    // Envoyer la notification
    try {
      await webpush.sendNotification(pushData.subscription, payload)
      console.log(`[PUSH] Notification sent to ${email}`)
      return NextResponse.json({ success: true, sent: true })
    } catch (pushError: any) {
      // Si l'abonnement a expire (410 Gone)
      if (pushError.statusCode === 410) {
        console.log(`[PUSH] Subscription expired for ${email}, removing...`)
        await redis.del(`push:${email}`)
        return NextResponse.json({ error: 'Abonnement expire', sent: false }, { status: 410 })
      }
      throw pushError
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[PUSH] Notify error:', errorMessage)
    return NextResponse.json({ error: errorMessage, sent: false }, { status: 500 })
  }
}
