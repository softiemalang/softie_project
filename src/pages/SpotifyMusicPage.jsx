import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../lib/router'
import { getCurrentSession } from '../lib/auth'
import { getOrCreatePushDeviceId } from '../lib/device'
import {
  connectSpotify,
  disconnectSpotify,
  getSpotifyAppUrl,
  getSpotifyCurrentlyPlaying,
  getSpotifyDevices,
  getSpotifyPlaybackState,
  isSpotifyConnected,
  nextSpotify,
  pauseSpotify,
  playSpotify,
  previousSpotify,
  transferSpotifyPlayback,
} from '../music/spotifyApi'

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function getTrackArtists(track) {
  if (!track?.artists?.length) return '아티스트 정보 없음'
  return track.artists.map((artist) => artist.name).join(', ')
}

function getTrackImage(track) {
  return (
    track?.album?.images?.[0]?.url ||
    track?.album?.images?.[1]?.url ||
    track?.album?.images?.[2]?.url ||
    ''
  )
}

function getFriendlyError(error) {
  const message = error?.message || 'Spotify 정보를 불러오지 못했어요.'

  if (message.includes('SPOTIFY_NOT_CONNECTED')) {
    return '아직 Spotify 연결이 없어요. 먼저 연결을 완료해 주세요.'
  }

  if (message.includes('NO_ACTIVE_DEVICE')) {
    return '활성 Spotify 기기가 아직 없어요. 앱을 한 번 열어두면 이 페이지에서 바로 조작할 수 있어요.'
  }

  if (message.includes('PREMIUM_REQUIRED')) {
    return 'Spotify Connect 제어에는 Premium 계정이 필요해요.'
  }

  return message
}

export default function SpotifyMusicPage() {
  const [userId, setUserId] = useState('')
  const [session, setSession] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isControlling, setIsControlling] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [playbackState, setPlaybackState] = useState(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [devices, setDevices] = useState([])
  const [progressMs, setProgressMs] = useState(0)

  const track = playbackState?.item || currentlyPlaying?.item || null
  const isPlaying = Boolean(playbackState?.is_playing ?? currentlyPlaying?.is_playing)
  const device = playbackState?.device || currentlyPlaying?.device || devices.find((item) => item.is_active) || null
  const hasActiveDevice = devices.some((item) => item.is_active) || Boolean(device)
  const albumImage = getTrackImage(track)
  const durationMs = track?.duration_ms || currentlyPlaying?.item?.duration_ms || 0
  const progressRatio = durationMs > 0 ? Math.min(progressMs / durationMs, 1) : 0

  useEffect(() => {
    let mounted = true

    async function init() {
      setIsLoading(true)
      try {
        const nextSession = await getCurrentSession()
        const fallbackDeviceId = getOrCreatePushDeviceId()
        if (!mounted) return

        setSession(nextSession)
        setUserId(nextSession?.user?.id || fallbackDeviceId)
        setIsConnected(isSpotifyConnected())
        const params = new URLSearchParams(window.location.search)
        const spotifyError = params.get('spotify_error')
        if (spotifyError) {
          setStatusMessage(decodeURIComponent(spotifyError))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [])

  async function refreshDashboard(options = {}) {
    const targetUserId = options.userId || userId
    if (!targetUserId || !isConnected) return

    setIsRefreshing(true)
    if (!options.silent) {
      setStatusMessage('')
    }

    try {
      const [playbackResult, currentlyPlayingResult, devicesResult] = await Promise.all([
        getSpotifyPlaybackState(targetUserId),
        getSpotifyCurrentlyPlaying(targetUserId),
        getSpotifyDevices(targetUserId),
      ])

      setPlaybackState(playbackResult?.playback ?? playbackResult?.data ?? null)
      setCurrentlyPlaying(currentlyPlayingResult?.playback ?? currentlyPlayingResult?.data ?? null)
      setDevices(devicesResult?.devices ?? devicesResult?.data?.devices ?? [])

      const nextProgress =
        playbackResult?.playback?.progress_ms ??
        currentlyPlayingResult?.playback?.progress_ms ??
        0
      setProgressMs(nextProgress)

      if (!playbackResult?.playback && !currentlyPlayingResult?.playback) {
        setStatusMessage('재생 정보를 기다리는 중이에요. Spotify 앱을 열어두면 이 화면이 더 빠르게 채워져요.')
      }
    } catch (error) {
      console.error('[SpotifyMusicPage.refreshDashboard]', error)

      if (error?.message?.includes('SPOTIFY_NOT_CONNECTED')) {
        disconnectSpotify()
        setIsConnected(false)
      }

      setStatusMessage(getFriendlyError(error))
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!userId || !isConnected) return
    refreshDashboard({ userId, silent: true })
  }, [userId, isConnected])

  useEffect(() => {
    if (!userId || !isConnected) return undefined

    const timer = window.setInterval(() => {
      refreshDashboard({ userId, silent: true })
    }, 20000)

    return () => window.clearInterval(timer)
  }, [userId, isConnected])

  useEffect(() => {
    if (!isPlaying || !durationMs) return undefined

    const timer = window.setInterval(() => {
      setProgressMs((current) => Math.min(current + 1000, durationMs))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isPlaying, durationMs])

  async function handleConnect() {
    if (!userId) return

    try {
      setStatusMessage('')
      await connectSpotify(userId, { returnPath: '/music' })
    } catch (error) {
      console.error('[SpotifyMusicPage.handleConnect]', error)
      setStatusMessage(getFriendlyError(error))
    }
  }

  async function runControl(action, handler) {
    if (!userId) return

    setIsControlling(true)
    setStatusMessage('')

    try {
      await handler()
      await refreshDashboard({ userId, silent: true })

      if (action === 'transferPlayback') {
        setStatusMessage('재생 기기를 전환했어요.')
      }
    } catch (error) {
      console.error(`[SpotifyMusicPage.${action}]`, error)
      setStatusMessage(getFriendlyError(error))
    } finally {
      setIsControlling(false)
    }
  }

  const deviceCards = useMemo(() => {
    if (!devices.length) return []

    return devices.map((item) => ({
      ...item,
      label: item.is_active ? '현재 재생 중인 기기' : '대기 중인 기기',
      kind: item.type || '기기',
    }))
  }, [devices])

  return (
    <div className="app-shell music-shell">
      <section className="card music-status-card">
        <div className="card-header music-status-header">
          <div>
            <p className="section-kicker">Spotify</p>
            {!isConnected && (
              <p className="subtle music-status-copy">
                Spotify 계정을 연결하면 현재 재생 중인 음악을 확인하고 Connect 기기를 조작할 수 있어요.
              </p>
            )}
          </div>
          <div className="music-status-actions">
            {isConnected ? (
              <span className="pill music-connection-pill">연결됨</span>
            ) : (
              <button type="button" className="soft-button music-connect-button" onClick={handleConnect} disabled={!userId}>
                Spotify 연결
              </button>
            )}
            <button type="button" className="ghost-button music-home-button" onClick={() => navigate('/')}>
              홈
            </button>
          </div>
        </div>
        {!session && !isConnected && (
          <p className="subtle music-login-hint">
            지금은 기기 ID로도 연결할 수 있지만, 개인용 토큰 관리를 위해 로그인 상태에서 쓰는 편이 더
            안정적이에요.
          </p>
        )}
      </section>

      {isLoading ? (
        <section className="card">
          <p className="section-kicker">Music</p>
          <h2>Spotify 리모컨을 준비하고 있어요.</h2>
          <p className="subtle">기기와 연결 상태를 차분히 확인하는 중입니다.</p>
        </section>
      ) : null}

      {statusMessage ? <p className="status">{statusMessage}</p> : null}

      <section className="card music-now-card">
        <div className="card-header">
          <p className="section-kicker">Now Playing</p>
          {isConnected && (
            <button
              type="button"
              className="ghost-button music-refresh-button"
              onClick={() => refreshDashboard({ userId })}
              disabled={!userId || isRefreshing}
            >
              {isRefreshing ? '갱신 중' : '새로고침'}
            </button>
          )}
        </div>

        <div className="music-now-layout">
          <div className="music-now-copy">
            <h2>{track?.name || '재생 중인 곡을 기다리는 중이에요'}</h2>
            <p className="subtle music-track-meta">
              {track
                ? `${getTrackArtists(track)} · ${track.album?.name || '앨범 정보 없음'}`
                : 'Spotify 앱을 열고 재생을 시작하면 이 카드가 채워져요.'}
            </p>
          </div>

          {albumImage ? (
            <img className="music-cover" src={albumImage} alt={track?.name || 'album cover'} />
          ) : (
            <div className="music-cover music-cover-placeholder">
              <span>Album</span>
            </div>
          )}

          <div className="music-progress-wrap">
            <div className="music-progress">
              <div className="music-progress-fill" style={{ width: `${progressRatio * 100}%` }} />
            </div>
            <div className="music-progress-time">
              <span>{formatDuration(progressMs)}</span>
              <span>{formatDuration(durationMs)}</span>
            </div>
          </div>

          <div className="music-meta-grid">
            <div className="music-meta-card">
              <span className="meta-label">재생 상태</span>
              <strong>{isPlaying ? '재생 중' : '대기 중'}</strong>
            </div>
            <div className="music-meta-card">
              <span className="meta-label">현재 기기</span>
              <strong>{device?.name || '활성 기기 없음'}</strong>
            </div>
          </div>

          <div className="music-control-row">
            <button
              type="button"
              className="music-control-button"
              disabled={!isConnected || isControlling}
              onClick={() => runControl('previous', () => previousSpotify(userId))}
            >
              이전곡
            </button>
            <button
              type="button"
              className="music-control-button music-control-button-primary"
              disabled={!isConnected || isControlling}
              onClick={() =>
                runControl(isPlaying ? 'pause' : 'play', () =>
                  isPlaying ? pauseSpotify(userId) : playSpotify(userId)
                )
              }
            >
              {isPlaying ? '일시정지' : '재생'}
            </button>
            <button
              type="button"
              className="music-control-button"
              disabled={!isConnected || isControlling}
              onClick={() => runControl('next', () => nextSpotify(userId))}
            >
              다음곡
            </button>
          </div>
        </div>
      </section>

      {!hasActiveDevice && (
        <section className="card">
          <p className="section-kicker">Ready</p>
          <h2>아직 활성 Spotify 기기가 없어요.</h2>
          <p className="subtle">
            Spotify 앱을 한 번 열어두면 이 페이지에서 리모컨처럼 조작할 수 있어요.
          </p>
          <a className="soft-button music-link-button" href={getSpotifyAppUrl()} target="_blank" rel="noreferrer">
            Spotify 앱으로 열기
          </a>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <div>
            <p className="section-kicker">Devices</p>
            <h2>재생 기기</h2>
            <p className="subtle">지금 켜진 기기만 빠르게 전환할 수 있어요.</p>
          </div>
        </div>

        {deviceCards.length ? (
          <div className="music-device-list">
            {deviceCards.map((item) => (
              <article key={item.id} className={`music-device-card ${item.is_active ? 'active' : ''}`}>
                <div className="music-device-copy">
                  <p className="section-kicker music-device-kind">{item.kind}</p>
                  <h3>{item.name}</h3>
                  <p className="subtle music-device-status">
                    {item.label}
                    {typeof item.volume_percent === 'number' ? ` · 볼륨 ${item.volume_percent}%` : ''}
                  </p>
                </div>
                {item.is_active ? (
                  <span className="pill music-device-badge">현재 기기</span>
                ) : (
                  <button
                    type="button"
                    className="ghost-button music-device-button"
                    disabled={isControlling}
                    onClick={() =>
                      runControl('transferPlayback', () => transferSpotifyPlayback(userId, item.id))
                    }
                  >
                    전환
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="subtle">현재 보이는 Spotify Connect 기기가 아직 없어요.</p>
        )}
      </section>
    </div>
  )
}
