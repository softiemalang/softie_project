import { useEffect, useState } from 'react'

function getPathname() {
  return window.location.pathname || '/'
}

export function navigate(path) {
  if (window.location.pathname === path) return
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
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
