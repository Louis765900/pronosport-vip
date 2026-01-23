import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Redis } from '@upstash/redis'
import { UserPushSubscription } from '@/types'

export const dynamic = 'force-dynamic'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN

/**
 * POST - S'abonner aux notifications push
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const session = cookieStore.get('vip_session')?.value
    const userEmail = cookieStore.get('user_email')?.value

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'Email utilisateur non trouve' }, { status: 400 })
    }

    const { subscription } = await req.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })

    const pushData: UserPushSubscription = {
      email: userEmail,
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      createdAt: new Date().toISOString(),
      isActive: true
    }

    await redis.set(`push:${userEmail}`, JSON.stringify(pushData))

    console.log(`[PUSH] Subscription created for ${userEmail}`)
    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[PUSH] Subscribe error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * DELETE - Se desabonner des notifications push
 */
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const userEmail = cookieStore.get('user_email')?.value

    if (!userEmail) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ error: 'Configuration Redis manquante' }, { status: 500 })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })
    await redis.del(`push:${userEmail}`)

    console.log(`[PUSH] Subscription deleted for ${userEmail}`)
    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('[PUSH] Unsubscribe error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * GET - Verifier le statut de l'abonnement
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const userEmail = cookieStore.get('user_email')?.value

    if (!userEmail) {
      return NextResponse.json({ subscribed: false })
    }

    if (!redisUrl || !redisToken) {
      return NextResponse.json({ subscribed: false })
    }

    const redis = new Redis({ url: redisUrl, token: redisToken })
    const pushData = await redis.get(`push:${userEmail}`)

    return NextResponse.json({
      subscribed: !!pushData,
      email: userEmail
    })

  } catch (error) {
    return NextResponse.json({ subscribed: false })
  }
}
