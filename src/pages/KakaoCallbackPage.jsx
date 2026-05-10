import { useEffect, useState } from 'react'
import { navigate } from '../lib/router'
import { completeKakaoMemoLoginFromCallback } from '../lib/kakaoMessage'

function getReturnPath(value) {
  if (!value || typeof value !== 'string') return '/scheduler'
  if (!value.startsWith('/')) return '/scheduler'
  if (value.startsWith('//')) return '/scheduler'
  return value
}

export default function KakaoCallbackPage() {
  const [message, setMessage] = useState('카카오 연결을 마무리하고 있어요...')
  const [isFailed, setIsFailed] = useState(false)

  useEffect(() => {
    let mounted = true

    async function completeLogin() {
      try {
        const result = await completeKakaoMemoLoginFromCallback()
        const returnPath = getReturnPath(result.returnPath)

        if (!mounted) return

        if (result.ok) {
          setMessage(result.sentPending
            ? '나와의 채팅방으로 근무 일지를 보냈어요.'
            : '카카오 연결이 완료됐어요.')
          window.setTimeout(() => navigate(returnPath), 900)
          return
        }

        setIsFailed(true)
        setMessage(result.message || '카카오 연결을 마무리하지 못했어요. 다시 시도해 주세요.')
        window.setTimeout(() => navigate(returnPath), 1600)
      } catch (error) {
        console.error('[KakaoCallbackPage] Kakao callback failed.', error)
        if (!mounted) return

        setIsFailed(true)
        setMessage(error instanceof Error ? error.message : '카카오 연결 중 오류가 발생했어요.')
        window.setTimeout(() => navigate('/scheduler'), 1800)
      }
    }

    completeLogin()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="app-shell scheduler-shell">
      <section className="scheduler-panel" style={{ marginTop: '4rem', textAlign: 'center' }}>
        <p className="scheduler-section-label">KAKAO</p>
        <h1 style={{ fontSize: '1.35rem', margin: '0.35rem 0 0.75rem' }}>
          {isFailed ? '연결 확인이 필요해요' : '카카오 연결 중'}
        </h1>
        <p className="subtle">{message}</p>
      </section>
    </div>
  )
}
