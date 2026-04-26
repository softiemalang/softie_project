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

function getWebPushPublicKey() {
  const rawValue = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY
  return typeof rawValue === 'string' ? rawValue.trim() : ''
}

async function getServiceWorkerRegistration(onDebug = null) {
  if (!isPushSupported()) return null
  if (onDebug) onDebug('서비스 워커 레지스트레이션 확인 중...')
  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing) {
    if (onDebug) onDebug('기존 서비스 워커를 찾았어요.')
    return existing
  }
  if (onDebug) onDebug('서비스 워커 등록 시도 중...')
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

async function storePushSubscription(subscription, deviceId = null, onDebug = null) {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }

  if (onDebug) onDebug('Supabase에 구독 정보 저장 중...')
  const { data, error } = await supabase.functions.invoke('register-push-subscription', {
    body: {
      deviceId: deviceId || getOrCreatePushDeviceId(),
      subscription,
      userAgent: navigator.userAgent || '',
      platform: getBrowserPlatform(),
    },
  })

  if (error) throw await unwrapFunctionError(error)
  if (onDebug) onDebug('Supabase 저장 완료.')
  return data
}

export async function subscribeSchedulerPush(deviceId = null, onDebug = null) {
  if (onDebug) onDebug('지원 환경 체크 중...')
  if (!isPushSupported()) {
    throw new Error(getSchedulerPushSupportMessage())
  }

  if (onDebug) onDebug('VAPID 키 확인 중...')
  const vapidPublicKey = getWebPushPublicKey()
  if (!vapidPublicKey) {
    throw new Error('VITE_WEB_PUSH_PUBLIC_KEY 설정이 필요해요.')
  }

  if (onDebug) onDebug('알림 권한 요청 중...')
  const permission = await requestSchedulerNotificationPermission()
  if (onDebug) onDebug(`권한 결과: ${permission}`)
  if (permission !== 'granted') {
    throw new Error('알림 권한이 허용되지 않았어요.')
  }

  if (onDebug) onDebug('서비스 워커 준비 중...')
  const registration = await getServiceWorkerRegistration(onDebug)
  if (onDebug) onDebug('기존 푸시 구독 확인 중...')
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    if (onDebug) onDebug('새 푸시 구독 생성 중...')
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  await storePushSubscription(subscription.toJSON(), deviceId, onDebug)
  return subscription
}

export async function sendSchedulerTestPush(deviceId = null) {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }

  const { data, error } = await supabase.functions.invoke('send-test-push', {
    body: {
      deviceId: deviceId || getOrCreatePushDeviceId(),
    },
  })

  if (error) throw await unwrapFunctionError(error)
  return data
}

export async function getSchedulerPushPreferences(deviceId = null) {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }

  const { data, error } = await supabase.functions.invoke('get-push-preferences', {
    body: {
      deviceId: deviceId || getOrCreatePushDeviceId(),
    },
  })

  if (error) throw await unwrapFunctionError(error)
  return data
}

export async function updateSchedulerPushPreferences(preferences, deviceId = null) {
  if (!supabase) {
    throw new Error('Supabase 설정이 없어요. 환경변수를 확인해 주세요.')
  }

  const { data, error } = await supabase.functions.invoke('update-push-preferences', {
    body: {
      deviceId: deviceId || getOrCreatePushDeviceId(),
      ...preferences,
    },
  })

  if (error) throw await unwrapFunctionError(error)
  return data
}

async function unwrapFunctionError(error) {
  if (!error || typeof error !== 'object') {
    return new Error('알림 서버 요청 중 알 수 없는 오류가 발생했어요.')
  }

  const explicitError =
    Reflect.get(error, 'error')
    || Reflect.get(error, 'message')
    || Reflect.get(error, 'details')

  if (typeof explicitError === 'string' && explicitError.trim() && explicitError !== 'FunctionsFetchError') {
    return new Error(explicitError.trim())
  }

  const response = Reflect.get(error, 'context')
  const canReadJson = response && typeof response.json === 'function'
  const canReadText = response && typeof response.text === 'function'

  if (canReadJson || canReadText) {
    try {
      const payload =
        typeof response.clone === 'function'
          ? await response.clone().json()
          : await response.json()

      if (payload && typeof payload.error === 'string' && payload.error.trim()) {
        const step = typeof payload.step === 'string' && payload.step.trim() ? payload.step.trim() : ''
        const details = typeof payload.details === 'string' && payload.details.trim() ? payload.details.trim() : ''
        const composed = [step ? `[${step}]` : '', payload.error, details].filter(Boolean).join(' ')
        return new Error(composed)
      }

      if (payload && typeof payload.message === 'string' && payload.message.trim()) {
        return new Error(payload.message)
      }
    } catch {
      // Fall through to text parsing.
    }

    try {
      const text =
        typeof response.clone === 'function'
          ? await response.clone().text()
          : await response.text()

      if (typeof text === 'string' && text.trim()) {
        return new Error(text.trim())
      }
    } catch {
      // Fall through to generic fallback.
    }
  }

  if (error instanceof Error) return error
  return new Error('알림 서버 요청 중 오류가 발생했어요.')
}
