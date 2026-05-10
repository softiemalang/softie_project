(() => {
  const ROW_ATTR = 'data-softie-worklog-action-row'
  const MEMO_ATTR = 'data-softie-kakao-memo-button'

  function getButtonText(button) {
    return (button?.innerText || button?.textContent || '').trim()
  }

  function findWorkLogModal() {
    const candidates = Array.from(document.querySelectorAll('.scheduler-modal, [role="dialog"], .scheduler-sheet'))
    return candidates.find((modal) => {
      const text = modal.innerText || modal.textContent || ''
      return text.includes('근무 일지') && text.includes('주간 기록 복사') && text.includes('나에게 보내기')
    })
  }

  function findSummaryCard(modal) {
    const candidates = Array.from(modal.querySelectorAll('*'))
      .filter((element) => {
        const text = (element.innerText || element.textContent || '').trim()
        return text.includes('주간 총계') && /\d+(?:\.\d+)?시간/.test(text) && text.length <= 80
      })
      .sort((a, b) => {
        const aText = (a.innerText || a.textContent || '').trim()
        const bText = (b.innerText || b.textContent || '').trim()
        return aText.length - bText.length
      })

    return candidates[0] || null
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

  function alignWorkLogActions() {
    const modal = findWorkLogModal()
    if (!modal) return

    const memoButton = modal.querySelector(`button[${MEMO_ATTR}]`)
    const copyButton = Array.from(modal.querySelectorAll('button'))
      .find((button) => getButtonText(button).includes('주간 기록 복사'))

    if (!copyButton || !memoButton) return

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
    row.style.marginTop = '0.75rem'
    row.style.marginBottom = '0'

    styleActionButton(copyButton)
    styleActionButton(memoButton)

    if (copyButton.parentNode !== row) row.appendChild(copyButton)
    if (memoButton.parentNode !== row) row.appendChild(memoButton)
  }

  alignWorkLogActions()

  const observer = new MutationObserver(alignWorkLogActions)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
})()
