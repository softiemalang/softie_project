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
  checkSpotifySavedTrack,
  saveSpotifyTrack,
  removeSpotifyTrack,
  setSpotifyVolume,
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

  if (message.includes('SPOTIFY_LIBRARY_PERMISSION_DENIED') || message.includes('insufficient scope') || message.includes('user-library')) {
    return '곡 저장 권한이 부족해요. 상단의 재설정 버튼을 눌러 다시 연결해 주세요.'
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
  const [needsReconnect, setNeedsReconnect] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isControlling, setIsControlling] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [playbackState, setPlaybackState] = useState(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [devices, setDevices] = useState([])
  const [progressMs, setProgressMs] = useState(0)

  // Track Save State
  const [isTrackSaved, setIsTrackSaved] = useState(false)
  const [isCheckingSaved, setIsCheckingSaved] = useState(false)
  const [isSavingTrack, setIsSavingTrack] = useState(false)

  // Volume State
  const [selectedVolumeDevice, setSelectedVolumeDevice] = useState(null)
  const [volumeDraft, setVolumeDraft] = useState(0)
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false)
  const [isChangingVolume, setIsChangingVolume] = useState(false)
  const [volumeError, setVolumeError] = useState('')

  const track = playbackState?.item || currentlyPlaying?.item || null
  const trackId = track?.id || ''
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

  useEffect(() => {
    if (!userId || !isConnected || !trackId) {
      setIsTrackSaved(false)
      return
    }

    async function checkSaved() {
      setIsCheckingSaved(true)
      try {
        const result = await checkSpotifySavedTrack(userId, trackId)
        if (Array.isArray(result?.data)) {
          setIsTrackSaved(Boolean(result.data[0]))
        }
      } catch (error) {
        console.error('[SpotifyMusicPage.checkSaved]', error)
        if (
          error?.message?.includes('SPOTIFY_LIBRARY_PERMISSION_DENIED') ||
          error?.message?.includes('insufficient scope') ||
          error?.message?.includes('user-library') ||
          error?.message?.includes('저장 권한')
        ) {
          setNeedsReconnect(true)
        }
      } finally {
        setIsCheckingSaved(false)
      }
    }

    checkSaved()
  }, [userId, isConnected, trackId])

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
        setStatusMessage('재생 정보를 기다리는 중이에요.')
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

  async function handleToggleSave() {
    if (!userId || !trackId || isSavingTrack || isCheckingSaved) return

    setIsSavingTrack(true)
    const originalState = isTrackSaved
    try {
      if (originalState) {
        await removeSpotifyTrack(userId, trackId)
        setIsTrackSaved(false)
      } else {
        await saveSpotifyTrack(userId, trackId)
        setIsTrackSaved(true)
      }
    } catch (error) {
      console.error('[SpotifyMusicPage.handleToggleSave]', error)
      if (
        error?.message?.includes('SPOTIFY_LIBRARY_PERMISSION_DENIED') ||
        error?.message?.includes('insufficient scope') ||
        error?.message?.includes('user-library') ||
        error?.message?.includes('저장 권한')
      ) {
        setNeedsReconnect(true)
      }
      setStatusMessage(getFriendlyError(error))
    } finally {
      setIsSavingTrack(false)
    }
  }

  async function handleVolumeStep(direction) {
    if (!userId || !selectedVolumeDevice || isChangingVolume) return

    const step = direction === 'up' ? 10 : -10
    const nextVolume = Math.max(0, Math.min(100, volumeDraft + step))
    
    setVolumeDraft(nextVolume)
    setIsChangingVolume(true)
    setVolumeError('')

    try {
      await setSpotifyVolume(userId, nextVolume, selectedVolumeDevice.id)
    } catch (error) {
      console.error('[SpotifyMusicPage.handleVolumeStep]', error)
      setVolumeError('볼륨 조절에 실패했습니다.')
    } finally {
      setIsChangingVolume(false)
    }
  }

  function openVolumeModal(targetDevice) {
    setSelectedVolumeDevice(targetDevice)
    setVolumeDraft(typeof targetDevice.volume_percent === 'number' ? targetDevice.volume_percent : 50)
    setIsVolumeModalOpen(true)
    setVolumeError('')
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
        <header className="music-status-header">
          <span className="section-kicker">SPOTIFY</span>
          {isConnected ? (
            needsReconnect ? (
              <button type="button" className="soft-button music-reset-button" onClick={handleConnect}>
                재설정
              </button>
            ) : (
              <span className="pill music-connection-pill">연결됨</span>
            )
          ) : (
            <button type="button" className="soft-button music-connect-button" onClick={handleConnect} disabled={!userId}>
              Spotify 연결
            </button>
          )}
        </header>
        {!isConnected && (
          <p className="subtle music-status-copy">
            계정을 연결하면 재생 중인 곡을 확인하고 Connect 기기를 조작할 수 있어요.
          </p>
        )}
        {isConnected && needsReconnect && (
          <p className="subtle music-status-copy">
            곡 저장 기능을 사용하려면 추가 권한이 필요해요.
          </p>
        )}
        {!session && !isConnected && (
          <p className="subtle music-login-hint">
            개인용 토큰 관리를 위해 로그인 상태에서 쓰는 편이 더 안정적이에요.
          </p>
        )}
      </section>

      {isLoading ? (
        <section className="card">
          <header className="card-header">
            <span className="section-kicker">MUSIC</span>
          </header>
          <h2>Spotify 리모컨을 준비 중이에요.</h2>
          <p className="subtle">기기와 연결 상태를 확인하고 있습니다.</p>
        </section>
      ) : null}

      {statusMessage ? <p className="status">{statusMessage}</p> : null}

      <section className="card music-now-card">
        <header className="card-header music-now-header">
          <span className="section-kicker">Now Playing</span>
          {trackId && (
            <button
              type="button"
              className={`music-save-button ${isTrackSaved ? 'is-saved' : ''}`}
              onClick={handleToggleSave}
              disabled={isSavingTrack || isCheckingSaved}
              aria-label={isTrackSaved ? '좋아요 취소' : '좋아요'}
              title={isTrackSaved ? '좋아요 취소' : '좋아요'}
            >
              {isTrackSaved ? '♥' : '♡'}
            </button>
          )}
        </header>

        <div className="music-now-layout">
          <div className="music-now-copy">
            {track && <h2>{track.name}</h2>}
            {track && (
              <p className="subtle music-track-meta">
                {`${getTrackArtists(track)} · ${track.album?.name || '앨범 정보 없음'}`}
              </p>
            )}
          </div>

          {albumImage ? (
            <img className="music-cover" src={albumImage} alt={track?.name || 'album cover'} />
          ) : (
            <div className="music-cover music-cover-placeholder">
              <span>Album Cover</span>
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
              <strong className={isPlaying ? '' : 'is-muted'}>
                {isPlaying ? '재생 중' : '대기 중'}
              </strong>
            </div>
            <div className="music-meta-card">
              <span className="meta-label">현재 기기</span>
              <strong className={device?.name ? '' : 'is-muted'}>
                {device?.name || '활성 기기 없음'}
              </strong>
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

      <section className="card music-ready-card">
        <a className="music-app-link" href={getSpotifyAppUrl()} target="_blank" rel="noreferrer">
          Spotify 앱으로 열기
        </a>
        <span className={`pill music-ready-pill ${hasActiveDevice ? 'active' : 'inactive'}`}>
          {hasActiveDevice ? '활성' : '비활성'}
        </span>
      </section>

      <section className="card">
        <header className="card-header">
          <span className="section-kicker">Devices</span>
        </header>

        {deviceCards.length ? (
          <div className="music-device-list" style={{ marginTop: '0.65rem' }}>
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
                <div className="music-device-actions">
                  {!item.is_active && (
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
                  {typeof item.volume_percent === 'number' && (
                    <button
                      type="button"
                      className="ghost-button music-device-button music-volume-button"
                      onClick={() => openVolumeModal(item)}
                    >
                      볼륨
                    </button>
                  )}
                  {item.is_active && typeof item.volume_percent !== 'number' && (
                    <span className="pill music-device-badge">사용 중</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="subtle" style={{ marginTop: '0.8rem' }}>현재 보이는 Spotify Connect 기기가 아직 없어요.</p>
        )}
      </section>

      {isVolumeModalOpen && selectedVolumeDevice && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsVolumeModalOpen(false)}>
          <div className="scheduler-modal music-volume-modal" onClick={e => e.stopPropagation()}>
            <div className="scheduler-section-head" style={{ marginBottom: '0.65rem' }}>
              <div>
                <p className="scheduler-section-label">볼륨 조절</p>
              </div>
              <button type="button" className="scheduler-modal-close" onClick={() => setIsVolumeModalOpen(false)}>닫기</button>
            </div>

            <div className="music-volume-content">
              <p className="subtle music-volume-device-name">{selectedVolumeDevice.name}</p>
              
              <div className="music-volume-control">
                <button 
                  type="button" 
                  className="music-volume-step-btn" 
                  onClick={() => handleVolumeStep('down')}
                  disabled={isChangingVolume || volumeDraft <= 0}
                >
                  −
                </button>
                <div className="music-volume-display">
                  <strong>{volumeDraft}%</strong>
                </div>
                <button 
                  type="button" 
                  className="music-volume-step-btn" 
                  onClick={() => handleVolumeStep('up')}
                  disabled={isChangingVolume || volumeDraft >= 100}
                >
                  +
                </button>
              </div>

              {volumeError && <p className="music-volume-error">{volumeError}</p>}
            </div>

            <div className="scheduler-modal-actions" style={{ marginTop: '1.2rem' }}>
              <button type="button" className="scheduler-modal-btn primary" onClick={() => setIsVolumeModalOpen(false)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
