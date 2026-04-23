self.addEventListener('push', (event) => {
  const fallbackPayload = {
    title: '스케줄러 알림',
    body: '',
    url: '/scheduler',
    tag: 'scheduler-default',
  }

  let payload = fallbackPayload

  if (event.data) {
    try {
      payload = { ...fallbackPayload, ...event.data.json() }
    } catch {
      payload = { ...fallbackPayload, body: event.data.text() }
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: {
        url: payload.url || '/scheduler',
      },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = new URL(event.notification.data?.url || '/scheduler', self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }

          if ('navigate' in client) {
            return client.navigate(targetUrl).then(() => client.focus())
          }
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }

      return undefined
    }),
  )
})
