import { useEffect } from 'react'
import { sendKakaoMemoText, startKakaoMemoLogin } from '../lib/kakaoMessage'

const BUTTON_ATTR = 'data-softie-kakao-memo-button'
const DUPLICATE_SEND_COOLDOWN_MS = 3000

let lastSentMemo = {
  text: '',
  sentAt: 0,
}

function normalizeLines(text) {
  return String(text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function isDateLine(line) {
  return /^\d{1,2}\/\d{1,2}$/.test(line)
}

function isTimeRangeLine(line) {
  return /^\d{1,2}:\d{2}-\d{1,2}:\d{2}\s*\([^)]+\)$/.test(line)
}

function extractWorkLogEntries(rawLines) {
  const entries = []

  for (let index = 0; index < rawLines.length - 1; index += 1) {
    const current = rawLines[index]
    const next = rawLines[index + 1]

    if (isDateLine(current) && isTimeRangeLine(next)) {
      entries.push(current, next)
      index += 1
    }
  }

  return entries
}

function extractTotalText(rawLines) {
  const inlineTotal = rawLines.find(line => /^주간 총계\s*\d+(?:\.\d+)?시간$/.test(line))
  if (inlineTotal) {
    return inlineTotal.replace(/^주간 총계\s*/, '총 ')
  }

  const explicitTotal = rawLines.find(line => /^총\s*\d+(?:\.\d+)?시간$/.test(line))
  if (explicitTotal) return explicitTotal

  const totalValue = [...rawLines].reverse().find(line => /^\d+(?:\.\d+)?시간$/.test(line))
  return totalValue ? `총 ${totalValue}` : ''
}

function buildMemoTextFromModal(modal) {
  const rawLines = normalizeLines(modal?.innerText || modal?.textContent || '')
  const entries = extractWorkLogEntries(rawLines)
  const totalText = extractTotalText(rawLines) || '총 0시간'

  if (entries.length === 0) {
    return ['이번 주 근무 기록이 아직 없어요.', '', totalText].join('\n')
  }

  return [...entries, '', totalText].join('\n').slice(0, 900)
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

function getDuplicateCooldownRemaining(text) {
  if (lastSentMemo.text !== text) return 0
  return Math.max(0, DUPLICATE_SEND_COOLDOWN_MS - (Date.now() - lastSentMemo.sentAt))
}

function temporarilyDisableButton(button, label, durationMs = DUPLICATE_SEND_COOLDOWN_MS) {
  const original = button.dataset.originalLabel || '나에게 보내기'
  const cooldownUntil = Date.now() + durationMs

  button.dataset.cooldownUntil = String(cooldownUntil)
  button.disabled = true
  button.textContent = label

  window.setTimeout(() => {
    if (!button.isConnected) return
    if (Number(button.dataset.cooldownUntil || 0) > Date.now()) return

    button.disabled = false
    button.textContent = original
    delete button.dataset.cooldownUntil
  }, durationMs)
}

function showButtonFeedback(button, label) {
  const original = button.dataset.originalLabel || '나에게 보내기'
  button.textContent = label
  window.setTimeout(() => {
    if (button.isConnected && Number(button.dataset.cooldownUntil || 0) <= Date.now()) {
      button.textContent = original
    }
  }, 1800)
}

async function handleMemoButtonClick(button, modal) {
  const url = `${window.location.origin}/scheduler`
  const text = buildMemoTextFromModal(modal)
  const duplicateCooldownRemaining = getDuplicateCooldownRemaining(text)

  if (duplicateCooldownRemaining > 0) {
    temporarilyDisableButton(button, '잠시만요', duplicateCooldownRemaining)
    return
  }

  button.disabled = true
  button.textContent = '전송 중...'

  try {
    const result = await sendKakaoMemoText({ text, url })

    if (result.ok) {
      lastSentMemo = {
        text,
        sentAt: Date.now(),
      }
      temporarilyDisableButton(button, '보냈어요')
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
    if (button.isConnected && Number(button.dataset.cooldownUntil || 0) <= Date.now()) {
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
