'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerRegistration {
  update: () => Promise<void>
  unregister: () => Promise<boolean>
}

export function useServiceWorker(): {
  registration: ServiceWorkerRegistration | null
  isOffline: boolean
  isUpdateAvailable: boolean
  refreshApp: () => void
} {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)

  useEffect(() => {
    // Check online/offline status
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service worker registered:', reg)
          setRegistration(reg)

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true)
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Service worker registration failed:', error)
        })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const refreshApp = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  return {
    registration,
    isOffline,
    isUpdateAvailable,
    refreshApp
  }
}

// Hook for offline actions queue
export function useOfflineQueue() {
  const [queue, setQueue] = useState<any[]>([])

  const addToQueue = async (action: any) => {
    const id = Date.now().toString()
    const queuedAction = { ...action, id, timestamp: Date.now() }
    
    try {
      // Store in IndexedDB
      const db = await openDB()
      const transaction = db.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      await store.add(queuedAction)
      
      setQueue(prev => [...prev, queuedAction])
    } catch (error) {
      console.error('[SW] Failed to queue action:', error)
    }
  }

  const processQueue = async () => {
    if (!navigator.onLine) return

    try {
      const db = await openDB()
      const transaction = db.transaction(['actions'], 'readwrite')
      const store = transaction.objectStore('actions')
      const actions = await store.getAll()

      for (const action of actions) {
        try {
          await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body
          })
          
          await store.delete(action.id)
          setQueue(prev => prev.filter(item => item.id !== action.id))
        } catch (error) {
          console.error('[SW] Failed to process queued action:', action.id)
        }
      }
    } catch (error) {
      console.error('[SW] Failed to process queue:', error)
    }
  }

  useEffect(() => {
    // Process queue when coming back online
    const handleOnline = () => processQueue()
    window.addEventListener('online', handleOnline)
    
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return { queue, addToQueue, processQueue }
}

// Helper to open IndexedDB
async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('msika247-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id' })
      }
    }
  })
}
