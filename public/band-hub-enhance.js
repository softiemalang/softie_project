(() => {
  const MODAL_ID = 'band-account-logout-modal'

  function isBandHub() {
    return window.location.pathname.startsWith('/band') && document.querySelector('.band-hub-shell')
  }

  function closeModal() {
    document.getElementById(MODAL_ID)?.remove()
  }

  function escapeHtml(value) {
    const div = document.createElement('div')
    div.textContent = value || ''
    return div.innerHTML
  }

  function openLogoutModal(logoutButton, email) {
    closeModal()

    const backdrop = document.createElement('div')
    backdrop.id = MODAL_ID
    backdrop.className = 'band-modal-backdrop band-account-logout-backdrop'
    backdrop.setAttribute('role', 'presentation')

    const safeEmail = escapeHtml(email || '현재 계정')

    backdrop.innerHTML = `
      <section class="band-modal-sheet band-account-logout-sheet" role="dialog" aria-modal="true" aria-label="로그아웃 확인">
        <p class="subtle band-account-logout-copy">${safeEmail}에서 로그아웃해요.</p>
        <div class="band-logout-actions">
          <button type="button" class="soft-button" data-band-close-logout>닫기</button>
          <button type="button" class="danger-button" data-band-confirm-logout>로그아웃</button>
        </div>
      </section>
    `

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop || event.target.closest('[data-band-close-logout]')) {
        closeModal()
      }
      if (event.target.closest('[data-band-confirm-logout]')) {
        closeModal()
        logoutButton?.click()
      }
    })

    document.body.appendChild(backdrop)
  }

  function enhanceBandHub() {
    if (!isBandHub()) return

    const emailNode = document.querySelector('.band-hub-shell .compact-account-card .subtle')
    const logoutButton = document.querySelector('.band-hub-shell .compact-account-card .home-button')

    if (emailNode && logoutButton && !emailNode.dataset.bandLogoutReady) {
      emailNode.dataset.bandLogoutReady = 'true'
      emailNode.classList.add('band-account-email-trigger')
      emailNode.setAttribute('role', 'button')
      emailNode.setAttribute('tabindex', '0')
      emailNode.setAttribute('aria-label', '계정 로그아웃 메뉴 열기')

      const handleOpen = () => openLogoutModal(logoutButton, emailNode.textContent?.trim())
      emailNode.addEventListener('click', handleOpen)
      emailNode.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleOpen()
        }
      })
    }
  }

  const observer = new MutationObserver(() => enhanceBandHub())
  observer.observe(document.documentElement, { childList: true, subtree: true })
  window.addEventListener('DOMContentLoaded', enhanceBandHub)
  window.addEventListener('popstate', enhanceBandHub)
  setInterval(enhanceBandHub, 1200)
})()
