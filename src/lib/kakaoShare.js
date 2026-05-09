const KAKAO_JAVASCRIPT_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY

export function initKakao() {
  if (typeof window === 'undefined') return false
  if (!window.Kakao) {
    console.warn('[kakaoShare] Kakao SDK is not loaded.')
    return false
  }
  if (!KAKAO_JAVASCRIPT_KEY) {
    console.warn('[kakaoShare] VITE_KAKAO_JAVASCRIPT_KEY is not configured.')
    return false
  }

  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JAVASCRIPT_KEY)
  }

  return window.Kakao.isInitialized()
}

export function shareKakaoText({ text, url }) {
  if (!initKakao()) return false

  const shareUrl = url || window.location.href
  window.Kakao.Share.sendDefault({
    objectType: 'text',
    text,
    link: {
      mobileWebUrl: shareUrl,
      webUrl: shareUrl,
    },
  })

  return true
}
