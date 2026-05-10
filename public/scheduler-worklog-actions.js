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
      copyButton.parentNode.insertBefore(row, copyButton)
    }

    row.style.display = 'flex'
    row.style.alignItems = 'stretch'
    row.style.gap = '0.75rem'
    row.style.width = '100%'
    row.style.marginTop = '1.25rem'

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
