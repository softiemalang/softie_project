import { useEffect, useState } from 'react'

let activeViewTransition = null

function getPathname() {
  return window.location.pathname || '/'
}

function prefersReducedMotion() {
  if (typeof window.matchMedia !== 'function') return false

  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)')?.matches === true
  } catch {
    return false
  }
}

function cancelActiveViewTransition() {
  if (!activeViewTransition) return

  try {
    activeViewTransition.skipTransition?.()
  } catch {
    // A transition can finish between the check and skipTransition call.
  }
  activeViewTransition = null
}

function observeViewTransition(transition, onUpdateFailure) {
  activeViewTransition = transition

  Promise.resolve(transition?.updateCallbackDone).catch(() => {
    if (activeViewTransition === transition) onUpdateFailure?.()
  })
  Promise.resolve(transition?.ready).catch(() => {})
  Promise.resolve(transition?.finished)
    .catch(() => {})
    .then(() => {
      if (activeViewTransition === transition) activeViewTransition = null
    })
}

function commitNavigation(path) {
  if (window.location.pathname === path) return false
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  return true
}

export function navigate(path, options = {}) {
  if (window.location.pathname === path) return

  cancelActiveViewTransition()

  const shouldUseViewTransition = options?.viewTransition === true
    && typeof document !== 'undefined'
    && typeof document.startViewTransition === 'function'
    && !prefersReducedMotion()

  if (!shouldUseViewTransition) {
    commitNavigation(path)
    return
  }

  let didCommitNavigation = false
  try {
    const transition = document.startViewTransition(() => {
      didCommitNavigation = commitNavigation(path)
    })
    observeViewTransition(transition, () => {
      if (!didCommitNavigation) didCommitNavigation = commitNavigation(path)
    })
  } catch {
    // Keep navigation available if the API is unsupported or cannot start.
    if (!didCommitNavigation) commitNavigation(path)
  }
}

export function usePathname() {
  const [pathname, setPathname] = useState(getPathname())

  useEffect(() => {
    function handleLocationChange() {
      setPathname(getPathname())
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  return pathname
}
