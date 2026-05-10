import { useEffect } from 'react'
import { sendKakaoMemoText, startKakaoMemoLogin } from '../lib/kakaoMessage'

const BUTTON_ATTR = 'data-softie-kakao-memo-button'
const ROW_ATTR = 'data-softie-worklog-action-row'
const DUPLICATE_SEND_COOLDOWN_MS = 3000

let lastSentMemo = {
  text: '',
  sentAt: 0,
}

function getText(element) {
  return (element?.innerText || element?.textContent || '').trim()
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
    const text = getText(modal)
    return text.includes('근무 일지') && text.includes('주간')
  }) || null
}

function findCopyButton(modal) {
  const buttons = Array.from(modal.querySelectorAll('button'))
  return buttons.find(button => getText(button).includes('주간 기록 복사')) || null
}

function findSummaryCard(modal) {
  const candidates = Array.from(modal.querySelectorAll('*'))
    .filter(element => {
      const text = getText(element)
      return text.includes('주간 총계') && /\d+(?:\.\d+)?시간/.test(text) && text.length <= 80
    })
    .sort((a, b) => getText(a).length - getText(b).length)

  return candidates[0] || null
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

function styleActionButton(button) {
  button.style.flex = '1 1 0'
  button.style.width = '100%'
  button.style.minWidth = '0'
  button.style.margin = '0'
  button.style.display = 'inline-flex'
  button.style.alignItems = 'center'
  button.style.justifyContent = 'center'
  button.style.whiteSpace = 'nowrap'
  button.style.boxSizing = 'border-box'
}

function layoutWorkLogButtons(modal, copyButton, memoButton) {
  let row = modal.querySelector(`div[${ROW_ATTR}]`)
  if (!row) {
    row = document.createElement('div')
    row.setAttribute(ROW_ATTR, 'true')
  }

  const summaryCard = findSummaryCard(modal)
  if (summaryCard && row.previousElementSibling !== summaryCard) {
    summaryCard.insertAdjacentElement('afterend', row)
  } else if (!summaryCard && row.parentNode !== copyButton.parentNode) {
    copyButton.parentNode.insertBefore(row, copyButton)
  }

  row.style.display = 'flex'
  row.style.alignItems = 'stretch'
  row.style.gap = '0.75rem'
  row.style.width = '100%'
  row.style.marginTop = '0.55rem'
  row.style.marginBottom = '0'

  styleActionButton(copyButton)
  styleActionButton(memoButton)

  if (copyButton.parentNode !== row) row.appendChild(copyButton)
  if (memoButton.parentNode !== row) row.appendChild(memoButton)
}

function injectMemoButton() {
  const modal = findWorkLogModal()
  if (!modal) return

  const copyButton = findCopyButton(modal)
  if (!copyButton) return

  let button = modal.querySelector(`button[${BUTTON_ATTR}]`)
  if (!button) {
    button = document.createElement('button')
    button.type = 'button'
    button.setAttribute(BUTTON_ATTR, 'true')
    button.dataset.originalLabel = '나에게 보내기'
    button.textContent = '나에게 보내기'
    button.className = copyButton.className || 'soft-button'
    button.addEventListener('click', () => handleMemoButtonClick(button, modal))
  }

  layoutWorkLogButtons(modal, copyButton, button)
}

function hideWorkLogSummaryShareButton() {
  const buttons = Array.from(document.querySelectorAll('button'))

  buttons.forEach(button => {
    const buttonText = getText(button)
    if (buttonText !== '공유') return

    const card = button.closest('.scheduler-panel, .scheduler-setting-card')
    if (!card) return

    const cardText = getText(card)
    const hasWorkLogTitle = cardText.includes('근무 일지')
    const hasViewButton = Array.from(card.querySelectorAll('button')).some(candidate => getText(candidate) === '보기')

    if (hasWorkLogTitle && hasViewButton) {
      button.style.display = 'none'
      button.setAttribute('aria-hidden', 'true')
      button.tabIndex = -1
    }
  })
}

function applySchedulerDomEnhancements() {
  injectMemoButton()
  hideWorkLogSummaryShareButton()
}

export default function SchedulerKakaoMemoInjector({ pathname }) {
  useEffect(() => {
    if (!pathname?.startsWith('/scheduler')) return undefined

    applySchedulerDomEnhancements()

    const observer = new MutationObserver(() => applySchedulerDomEnhancements())
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [pathname])

  return null
}
