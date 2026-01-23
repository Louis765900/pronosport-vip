'use client'

import { useState, useEffect, useCallback } from 'react'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  // Verifier le support et l'etat de l'abonnement au montage
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window
      setIsSupported(supported)

      if (supported) {
        setPermission(Notification.permission)
        await checkSubscription()
      }
    }

    checkSupport()
  }, [])

  // Verifier si l'utilisateur est deja abonne
  const checkSubscription = useCallback(async () => {
    try {
      if (!('serviceWorker' in navigator)) return

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)

      // Verifier aussi cote serveur
      const response = await fetch('/api/push/subscribe')
      const data = await response.json()
      setIsSubscribed(data.subscribed)
    } catch (error) {
      console.error('[Push] Check subscription error:', error)
    }
  }, [])

  // S'abonner aux notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      console.warn('[Push] Notifications not supported')
      return false
    }

    setIsLoading(true)

    try {
      // Demander la permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        console.warn('[Push] Permission denied')
        setIsLoading(false)
        return false
      }

      // Enregistrer le Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Recuperer la cle publique VAPID
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        console.error('[Push] VAPID public key not configured')
        setIsLoading(false)
        return false
      }

      // Convertir la cle VAPID en Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }

      // S'abonner au push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Envoyer l'abonnement au serveur
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setIsSubscribed(true)
      console.log('[Push] Subscription successful')
      return true

    } catch (error) {
      console.error('[Push] Subscribe error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // Se desabonner
  const unsubscribe = useCallback(async () => {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      // Supprimer cote serveur
      await fetch('/api/push/subscribe', { method: 'DELETE' })

      setIsSubscribed(false)
      console.log('[Push] Unsubscribed successfully')
      return true

    } catch (error) {
      console.error('[Push] Unsubscribe error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Toggle
  const toggle = useCallback(async () => {
    if (isSubscribed) {
      return await unsubscribe()
    } else {
      return await subscribe()
    }
  }, [isSubscribed, subscribe, unsubscribe])

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    toggle,
    checkSubscription
  }
}
