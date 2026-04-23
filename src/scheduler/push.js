import { supabase } from '../lib/supabase'

const DEVICE_ID_STORAGE_KEY = 'scheduler:push-device-id'
const SERVICE_WORKER_PATH = '/scheduler-push-sw.js'

function hasWindow() {
  return typeof window !== 'undefined'
}

function getBrowserPlatform() {
  if (!hasWindow()) return ''
  const userAgent = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios'
  if (/Android/i.test(userAgent)) return 'android'
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macos'
  if (/Windows/i.test(userAgent)) return 'windows'
  return 'web'
}

function isStandaloneWebApp() {
  if (!hasWindow()) return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  return window.navigator.standalone === true
}

function isSecureOrigin() {
  if (!hasWindow()) return false
  return window.isSecureContext || window.location.hostname === 'localhost'
}

export function isPushSupported() {
  if (!hasWindow()) return false
  return (
    isSecureOrigin()
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
  )
}

export function getSchedulerPushSupportMessage() {
  if (isPushSupported()) return ''
  if (!hasWindow()) return '웹 알림을 사용할 수 없는 환경입니다.'

  if (getBrowserPlatform() === 'ios' && !isStandaloneWebApp()) {
    return 'iPhone에서는 홈 화면에 추가한 웹앱에서만 웹 푸시를 설정할 수 있어요. Safari 공유 메뉴에서 홈 화면에 추가한 뒤 다시 열어 주세요.'
  }

  if (getBrowserPlatform() === 'ios') {
    return '이 iPhone 홈 화면 앱 환경에서는 웹 푸시를 아직 사용할 수 없어요.'
  }

  if (!isSecureOrigin()) {
    return '웹 알림은 HTTPS 또는 로컬 개발 환경에서만 사용할 수 있어요.'
  }

  return '이 브라우저에서는 웹 푸시를 지원하지 않아요.'
}

function createFallbackUuid() {
  return `scheduler-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getOrCreatePushDeviceId() {
  if (!hasWindow()) return ''

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing

  const nextValue =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : createFallbackUuid()

  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextValue)
  return nextValue
}

function urlBase64ToUint8Array(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index)
  }

  return output
}

async function getServiceWorkerRegistration() {
  if (!isPushSupported()) return null
  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing) return existing
  return navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' })
}

export async function registerSchedulerPushServiceWorker() {
  try {
    await getServiceWorkerRegistration()
  } catch (error) {
    console.error('Failed to register scheduler push service worker.', error)
  }
}

export async function getSchedulerPushState() {
  const platform = getBrowserPlatform()
  const standalone = isStandaloneWebApp()

  if (!isPushSupported()) {
    return {
      supported: false,
      platform,
      standalone,
      permission: hasWindow() && 'Notification' in window ? Notification.permission : 'default',
      subscribed: false,
      supportMessage: getSchedulerPushSupportMessage(),
    }
  }

  const registration = await getServiceWorkerRegistration()
  const subscription = registration ? await registration.pushManager.getSubscription() : null

  return {
    supported: true,
    platform,
    standalone,
    permission: Notification.permission,
    subscribed: Boolean(subscription),
    supportMessage: '',
  }
}

export async function requestSchedulerNotificationPermission() {
  if (!isPushSupported()) {
    throw new Error(getSchedulerPushSupportMessage())
  }

  if (Notification.permission === 'granted') return 'granted'
  const permission = await Notification.requestPermission()
  return permission
}

async function storePushSubscription(subscription) {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }

  const { data, error } = await supabase.functions.invoke('register-push-subscription', {
    body: {
      deviceId: getOrCreatePushDeviceId(),
      subscription,
      userAgent: navigator.userAgent || '',
      platform: getBrowserPlatform(),
    },
  })

  if (error) throw error
  return data
}

export async function subscribeSchedulerPush() {
  if (!isPushSupported()) {
    throw new Error(getSchedulerPushSupportMessage())
  }

  const vapidPublicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY
  if (!vapidPublicKey) {
    throw new Error('VITE_WEB_PUSH_PUBLIC_KEY 설정이 필요해요.')
  }

  const permission = await requestSchedulerNotificationPermission()
  if (permission !== 'granted') {
    throw new Error('알림 권한이 허용되지 않았어요.')
  }

  const registration = await getServiceWorkerRegistration()
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  await storePushSubscription(subscription.toJSON())
  return subscription
}

export async function sendSchedulerTestPush() {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }

  const { data, error } = await supabase.functions.invoke('send-test-push', {
    body: {
      deviceId: getOrCreatePushDeviceId(),
    },
  })

  if (error) throw error
  return data
}
