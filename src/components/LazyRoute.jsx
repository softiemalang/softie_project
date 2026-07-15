import { Suspense } from 'react'

function RouteLoading() {
  return (
    <div className="app-shell">
      <p className="status" style={{ textAlign: 'center', marginTop: '4rem' }}>화면을 불러오는 중...</p>
    </div>
  )
}

export function LazyRoute({ children }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>
}
