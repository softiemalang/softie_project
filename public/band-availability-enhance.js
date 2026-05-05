(() => {
  const ROOT_CLASS = 'band-enhanced-availability-ready'
  const HIDDEN_CLASS = 'band-original-availability-hidden'
  const ENHANCED_CLASS = 'band-enhanced-availability'
  const ALL_HOURS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)
  const DEFAULT_HOURS = ALL_HOURS.filter((label) => {
    const hour = Number(label.slice(0, 2))
    return hour >= 10 && hour <= 23
  })
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const DAY_GROUPS = [
    { key: 'weekday', title: '평일', days: [0, 1, 2, 3, 4] },
    { key: 'weekend', title: '주말', days: [5, 6] },
  ]

  function parseHour(label) {
    const hour = Number(label?.slice(0, 2))
    return Number.isFinite(hour) ? hour : null
  }

  function getOriginalCells(grid) {
    const rows = Array.from(grid.querySelectorAll('.time-row-fragment'))
    const map = new Map()

    rows.forEach((row) => {
      const timeLabel = row.querySelector('.time-label')?.textContent?.trim()
      const hour = parseHour(timeLabel)
      if (hour === null) return

      const buttons = Array.from(row.querySelectorAll('.slot-button'))
      if (!map.has(hour)) map.set(hour, new Map())
      const dayMap = map.get(hour)

      buttons.forEach((button, dayIndex) => {
        dayMap.set(dayIndex, button)
      })
    })

    return map
  }

  function isActive(button) {
    return button?.classList.contains('active')
  }

  function buildEnhancedGrid(panel, originalGrid, cellMap) {
    const wrapper = document.createElement('div')
    wrapper.className = ENHANCED_CLASS
    wrapper.dataset.showAll = 'false'

    const toolbar = document.createElement('div')
    toolbar.className = 'band-enhanced-availability-toolbar'

    const status = document.createElement('span')
    status.className = 'band-enhanced-availability-status'
    status.textContent = panel.querySelector('.save-state')?.textContent?.trim() || '저장됨'

    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'soft-button band-enhanced-time-toggle'
    toggle.textContent = '전체 시간보기'

    toolbar.append(status, toggle)
    wrapper.appendChild(toolbar)

    const groupsWrap = document.createElement('div')
    groupsWrap.className = 'band-enhanced-availability-groups'
    wrapper.appendChild(groupsWrap)

    function syncStatus() {
      const originalStatus = panel.querySelector('.save-state')?.textContent?.trim()
      if (originalStatus) status.textContent = originalStatus
      status.classList.toggle('unsaved', originalStatus === '저장 필요')
    }

    function render() {
      syncStatus()
      const showAll = wrapper.dataset.showAll === 'true'
      const hours = showAll ? ALL_HOURS : DEFAULT_HOURS
      toggle.textContent = showAll ? '기본 시간보기' : '전체 시간보기'
      groupsWrap.innerHTML = ''

      DAY_GROUPS.forEach((group) => {
        const groupEl = document.createElement('section')
        groupEl.className = `band-enhanced-time-group ${group.key}`

        const title = document.createElement('div')
        title.className = 'band-enhanced-time-group-title'
        title.textContent = group.title
        groupEl.appendChild(title)

        const grid = document.createElement('div')
        grid.className = `band-enhanced-time-grid ${group.key}`
        grid.style.setProperty('--day-count', String(group.days.length))

        const topLeft = document.createElement('div')
        topLeft.className = 'band-enhanced-grid-corner'
        topLeft.textContent = group.key === 'weekday' ? status.textContent : ''
        topLeft.classList.toggle('unsaved', status.textContent === '저장 필요')
        grid.appendChild(topLeft)

        group.days.forEach((dayIndex) => {
          const day = document.createElement('div')
          day.className = `band-enhanced-day-label ${dayIndex >= 5 ? 'weekend' : 'weekday'}`
          day.textContent = DAY_LABELS[dayIndex]
          grid.appendChild(day)
        })

        hours.forEach((label) => {
          const hour = parseHour(label)
          const time = document.createElement('div')
          time.className = 'band-enhanced-time-label'
          time.textContent = label
          grid.appendChild(time)

          group.days.forEach((dayIndex) => {
            const original = cellMap.get(hour)?.get(dayIndex)
            const button = document.createElement('button')
            button.type = 'button'
            button.className = `band-enhanced-slot ${dayIndex >= 5 ? 'weekend' : 'weekday'} ${isActive(original) ? 'active' : ''}`
            button.setAttribute('aria-label', `${DAY_LABELS[dayIndex]} ${label}`)
            button.textContent = isActive(original) ? '✓' : ''
            button.disabled = !original
            button.addEventListener('click', () => {
              original?.click()
              requestAnimationFrame(render)
            })
            grid.appendChild(button)
          })
        })

        groupEl.appendChild(grid)
        groupsWrap.appendChild(groupEl)
      })
    }

    toggle.addEventListener('click', () => {
      wrapper.dataset.showAll = wrapper.dataset.showAll === 'true' ? 'false' : 'true'
      render()
    })

    wrapper.renderEnhancedAvailability = render
    render()
    originalGrid.insertAdjacentElement('afterend', wrapper)
    return wrapper
  }

  function enhance() {
    const panel = document.querySelector('.band-room-shell .band-panel-card')
    const originalGrid = panel?.querySelector('.band-availability-grid')
    if (!panel || !originalGrid) return

    let enhanced = panel.querySelector(`.${ENHANCED_CLASS}`)
    const cellMap = getOriginalCells(originalGrid)

    document.body.classList.add(ROOT_CLASS)
    originalGrid.classList.add(HIDDEN_CLASS)

    if (!enhanced) {
      enhanced = buildEnhancedGrid(panel, originalGrid, cellMap)
    } else {
      enhanced.renderEnhancedAvailability?.()
    }
  }

  const observer = new MutationObserver(() => enhance())
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  window.addEventListener('DOMContentLoaded', enhance)
  window.addEventListener('popstate', enhance)
  setInterval(enhance, 1000)
})()
