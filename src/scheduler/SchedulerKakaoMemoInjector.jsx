import { useEffect } from 'react'
import { sendKakaoMemoText, startKakaoMemoLogin } from '../lib/kakaoMessage'

const BUTTON_ATTR = 'data-softie-kakao-memo-button'

function normalizeLines(text) {
  return String(text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function buildMemoTextFromModal(modal) {
  const rawLines = normalizeLines(modal?.innerText || modal?.textContent || '')
  const blockedLabels = new Set([
    '근무 일지',
    '닫기',
    '이전 주',
    '다음 주',
    '주간 기록 복사',
    '복사됨',
    '나에게 보내기',
    '전송 중...',
    '보냈어요',
  ])

  const cleanedLines = rawLines.filter(line => {
    if (blockedLabels.has(line)) return false
    if (/^\d+건$/.test(line)) return false
    return true
  })

  const weekTitle = rawLines.find(line => /\d+월\s+\d+주차/.test(line)) || '근무 일지'
  const weekRange = rawLines.find(line => /^\d{1,2}\/\d{1,2}\s*-\s*\d{1,2}\/\d{1,2}$/.test(line))
  const totalLine = rawLines.find(line => line.startsWith('주간 총계'))
  const emptyLine = rawLines.find(line => line.includes('근무 기록이 아직 없어요'))

  if (emptyLine) {
    return [
      '근무 일지',
      weekRange ? `${weekTitle} · ${weekRange}` : weekTitle,
      '',
      '총 0시간',
      emptyLine,
    ].join('\n')
  }

  const bodyLines = cleanedLines
    .filter(line => line !== weekTitle && line !== weekRange && line !== totalLine)
    .filter(line => !line.includes('이번 주 근무 기록이 아직 없어요'))

  const lines = [weekTitle]
  if (weekRange) lines.push(weekRange)
  lines.push('')
  lines.push(...bodyLines)
  if (totalLine) {
    lines.push('', totalLine.replace(/^주간 총계\s*/, '총 '))
  }

  return lines.join('\n').slice(0, 900)
}

function findWorkLogModal() {
  const modals = Array.from(document.querySelectorAll('.scheduler-modal, [role="dialog"], .scheduler-sheet'))
  return modals.find(modal => {
    const text = modal.innerText || modal.textContent || ''
    return text.includes('근무 일지') && text.includes('주간')
  }) || null
}

function findCopyButton(modal) {
  const buttons = Array.from(modal.querySelectorAll('button'))
  return buttons.find(button => (button.innerText || button.textContent || '').trim().includes('주간 기록 복사')) || null
}

function showButtonFeedback(button, label) {
  const original = button.dataset.originalLabel || '나에게 보내기'
  button.textContent = label
  window.setTimeout(() => {
    if (button.isConnected) button.textContent = original
  }, 1800)
}

async function handleMemoButtonClick(button, modal) {
  const url = `${window.location.origin}/scheduler`
  const text = [buildMemoTextFromModal(modal), '', `자세히 보기: ${url}`].join('\n')

  button.disabled = true
  button.textContent = '전송 중...'

  try {
    const result = await sendKakaoMemoText({ text, url })

    if (result.ok) {
      showButtonFeedback(button, '보냈어요')
      return
    }

    if (result.reason === 'needs_login') {
      const started = startKakaoMemoLogin({
        returnPath: '/scheduler',
        pendingMemo: { text, url },
      })

      if (!started.ok) {
        window.alert('카카오 연결 설정을 확인해 주세요.')
      }
      return
    }

    window.alert('카카오톡 나에게 보내기에 실패했어요. 잠시 후 다시 시도해 주세요.')
  } catch (error) {
    console.error('[SchedulerKakaoMemoInjector] Failed to send memo.', error)
    window.alert('카카오톡 나에게 보내기 중 오류가 발생했어요.')
  } finally {
    if (button.isConnected) {
      button.disabled = false
      if (button.textContent === '전송 중...') button.textContent = button.dataset.originalLabel || '나에게 보내기'
    }
  }
}

function injectMemoButton() {
  const modal = findWorkLogModal()
  if (!modal || modal.querySelector(`[${BUTTON_ATTR}]`)) return

  const copyButton = findCopyButton(modal)
  if (!copyButton) return

  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute(BUTTON_ATTR, 'true')
  button.dataset.originalLabel = '나에게 보내기'
  button.textContent = '나에게 보내기'
  button.className = copyButton.className || 'soft-button'
  button.style.marginTop = '0.55rem'
  button.addEventListener('click', () => handleMemoButtonClick(button, modal))

  copyButton.insertAdjacentElement('afterend', button)
}

export default function SchedulerKakaoMemoInjector({ pathname }) {
  useEffect(() => {
    if (!pathname?.startsWith('/scheduler')) return undefined

    injectMemoButton()

    const observer = new MutationObserver(() => injectMemoButton())
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
