// Service Worker pour les notifications push - Pronosport VIP

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}

  const title = data.title || 'Pronosport VIP'
  const options = {
    body: data.body || 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100, 50, 100],
    data: {
      url: data.url || '/mes-paris',
      betId: data.betId
    },
    actions: [
      { action: 'open', title: 'Voir mes paris' },
      { action: 'close', title: 'Fermer' }
    ],
    tag: data.betId || 'pronosport-notification',
    renotify: true
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // Ouvrir la page mes-paris
  const urlToOpen = event.notification.data?.url || '/mes-paris'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Si une fenetre est deja ouverte, la focus
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        // Sinon ouvrir une nouvelle fenetre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

self.addEventListener('install', function(event) {
  console.log('[SW] Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', function(event) {
  console.log('[SW] Service Worker activated')
  event.waitUntil(self.clients.claim())
})
