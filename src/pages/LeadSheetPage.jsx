import { useState, useEffect, useRef } from 'react'
import { navigate } from '../lib/router'

const DEFAULT_LEAD_SHEET = `[곡명] 봄이 피어나다 (예시)
키: G | 템포: 92

[Intro]
G - C - D - Em
G - C - D - G

---
[A Part]
G        C        D        G
바람끝에 실려온 너의 그 목소리가
G        C        D        Em
차가웠던 내 맘을 조용히 두드리네

---
[B Part]
G        C        D        G
흩날리는 벚꽃이 길을 밝혀줄 때에
G        C        D        G
기다렸던 봄날의 이야기가 피어나

---
[Chorus]
C        D        Bm       Em
피어나, 우리 둘의 하모니가
C        D        G        G7
이 계절의 중심에 울려 퍼질 때
C        D        B        Em
눈부신 햇살이 우리를 비추고
C        D        G
따뜻한 봄이 피어나

---
[Outro]
G - C - D - Em
C - D - G (끝)`

export default function LeadSheetPage() {
  // 1. 다중 곡 목록 상태 및 기존 단일 데이터 마이그레이션 처리
  const [songs, setSongs] = useState(() => {
    const savedSongs = localStorage.getItem('leadSheetSongs')
    if (savedSongs) {
      return JSON.parse(savedSongs)
    }

    // 기존 단일 데이터 key인 'lead-sheet-text' 확인 및 마이그레이션
    const legacyText = localStorage.getItem('lead-sheet-text')
    if (legacyText && legacyText.trim()) {
      const title = legacyText.split('\n')[0]?.replace(/[\[\]]/g, '').trim() || '제목 없음'
      const legacySong = {
        id: 'song-legacy',
        title,
        content: legacyText,
        updatedAt: Date.now()
      }
      const list = [legacySong]
      localStorage.setItem('leadSheetSongs', JSON.stringify(list))
      localStorage.setItem('leadSheetActiveSongId', 'song-legacy')
      return list
    }

    // 기존 데이터도 없는 경우: 완전히 비어있는 상태로 시작
    const initialSong = {
      id: 'song-initial',
      title: '제목 없음',
      content: '',
      updatedAt: Date.now()
    }
    const list = [initialSong]
    localStorage.setItem('leadSheetSongs', JSON.stringify(list))
    localStorage.setItem('leadSheetActiveSongId', 'song-initial')
    return list
  })

  // 2. 활성화된 곡 ID 상태
  const [activeSongId, setActiveSongId] = useState(() => {
    return localStorage.getItem('leadSheetActiveSongId') || (songs[0]?.id || '')
  })

  // 3. 현재 텍스트 및 조절 설정
  const [inputText, setInputText] = useState(() => {
    const activeSong = songs.find(s => s.id === activeSongId)
    return activeSong ? activeSong.content : ''
  })
  
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('lead-sheet-page')
    return savedPage ? parseInt(savedPage, 10) : 0
  })

  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem('lead-sheet-font-size')
    return savedSize ? parseInt(savedSize, 10) : 24
  })

  const [isViewMode, setIsViewMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isListOpen, setIsListOpen] = useState(false) // 서랍 패널 노출 여부
  
  const containerRef = useRef(null)

  // 텍스트를 --- 구분자로 파싱하여 페이지 리스트 생성
  const pages = inputText
    .split(/\n?---\n?/)
    .map(p => p.trim())
    .filter(Boolean)

  // 전체 페이지 수가 변경되어 현재 페이지 범위를 벗어날 때 보정
  const totalPages = pages.length || 1
  const activePage = Math.min(currentPage, totalPages - 1)

  // LocalStorage 저장 동기화
  useEffect(() => {
    localStorage.setItem('lead-sheet-page', activePage.toString())
  }, [activePage])

  useEffect(() => {
    localStorage.setItem('lead-sheet-font-size', fontSize.toString())
  }, [fontSize])

  // activeSongId에 맞춰 텍스트 변경
  useEffect(() => {
    const activeSong = songs.find(s => s.id === activeSongId)
    if (activeSong) {
      setInputText(activeSong.content)
    }
  }, [activeSongId, songs])

  // Fullscreen 상태 모니터링 (크로스 브라우저 & iOS Safari 대응)
  useEffect(() => {
    function handleFullscreenChange() {
      const isCurrentlyFS = !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFS)
      if (isCurrentlyFS) {
        setIsFocusMode(true)
      } else {
        setIsFocusMode(false)
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // 키보드 방향키 이동 지원
  useEffect(() => {
    if (!isViewMode) return

    function handleKeyDown(event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        handleNextPage()
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        handlePrevPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isViewMode, activePage, totalPages])

  const handlePrevPage = () => {
    if (activePage > 0) {
      setCurrentPage(activePage - 1)
    }
  }

  const handleNextPage = () => {
    if (activePage < totalPages - 1) {
      setCurrentPage(activePage + 1)
    }
  }

  const zoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 48))
  }

  const zoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 14))
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    const doc = document
    const container = containerRef.current

    const requestFS = 
      container.requestFullscreen || 
      container.webkitRequestFullscreen || 
      container.mozRequestFullScreen || 
      container.msRequestFullscreen

    const exitFS = 
      doc.exitFullscreen || 
      doc.webkitExitFullscreen || 
      doc.mozCancelFullScreen || 
      doc.msExitFullscreen

    const activeFS = 
      doc.fullscreenElement || 
      doc.webkitFullscreenElement || 
      doc.mozFullScreenElement || 
      doc.msFullscreenElement

    if (requestFS && exitFS) {
      if (!activeFS) {
        requestFS.call(container)
          .then(() => {
            setIsFullscreen(true)
            setIsFocusMode(true)
          })
          .catch(err => {
            console.warn('전체화면 API 실패, 내부 전체화면(집중 모드)으로 폴백합니다:', err)
            setIsFocusMode(prev => !prev)
          })
      } else {
        exitFS.call(doc)
          .then(() => {
            setIsFullscreen(false)
            setIsFocusMode(false)
          })
          .catch(err => {
            console.error('전체화면 종료 중 에러:', err)
            setIsFocusMode(false)
          })
      }
    } else {
      setIsFocusMode(prev => !prev)
    }
  }

  // 섹션 묶기 로직 구현
  const groupSections = () => {
    // 1. 기존 --- 구분자 제거
    const cleanedText = inputText
      .split(/\n?---\n?/)
      .map(p => p.trim())
      .filter(Boolean)
      .join('\n\n')

    const lines = cleanedText.split('\n')
    const headerLines = []
    const sections = []
    let currentSection = null
    let hasFirstSectionStarted = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      const isSectionHeader = /^\[.+\]$/.test(trimmed)

      if (isSectionHeader) {
        hasFirstSectionStarted = true
        if (currentSection) {
          sections.push(currentSection)
        }
        currentSection = {
          title: line,
          lines: []
        }
      } else {
        if (!hasFirstSectionStarted) {
          headerLines.push(line)
        } else {
          if (currentSection) {
            currentSection.lines.push(line)
          }
        }
      }
    }
    
    if (currentSection) {
      sections.push(currentSection)
    }

    if (sections.length === 0) {
      alert('대괄호로 묶인 섹션 타이틀(예: [Intro])이 존재하지 않아 섹션을 묶을 수 없습니다.')
      return
    }

    // 16줄씩 묶어 페이지 나누기
    const pageGroups = []
    let currentPageLines = [...headerLines]

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i]
      const secLength = 1 + sec.lines.length

      if (currentPageLines.length > 0 && currentPageLines.length + secLength > 16) {
        pageGroups.push(currentPageLines.join('\n'))
        currentPageLines = []
      }

      currentPageLines.push(sec.title)
      currentPageLines.push(...sec.lines)
    }

    if (currentPageLines.length > 0) {
      pageGroups.push(currentPageLines.join('\n'))
    }

    const resultText = pageGroups.join('\n---\n')
    setInputText(resultText)
    setCurrentPage(0) // 첫 페이지로 이동
  }

  // 섹션 제목 하이라이트하여 보기 모드 렌더링
  const renderRichText = (text) => {
    if (!text) return '내용이 없습니다. 편집 버튼을 눌러 입력해주세요.'
    const lines = text.split('\n')
    return lines.map((line, idx) => {
      const trimmed = line.trim()
      const isSectionHeader = /^\[.+\]$/.test(trimmed)
      if (isSectionHeader) {
        return (
          <div key={idx} className="lead-sheet-section-header-line">
            {line}
          </div>
        )
      }
      return <div key={idx}>{line}</div>
    })
  }

  // --- 추가 곡 관리 기능 ---
  
  // 1. 현재 곡 저장
  const handleSaveSong = () => {
    const title = inputText.split('\n')[0]?.trim() || '제목 없음'
    const updated = songs.map(song => {
      if (song.id === activeSongId) {
        return {
          ...song,
          title,
          content: inputText,
          updatedAt: Date.now()
        }
      }
      return song
    })
    setSongs(updated)
    localStorage.setItem('leadSheetSongs', JSON.stringify(updated))
    alert('곡 저장 완료: ' + title)
  }

  // 2. 새 곡 생성
  const handleNewSong = () => {
    if (window.confirm('현재 편집 중인 내용을 저장하지 않았다면 유실될 수 있습니다. 새 곡을 생성할까요?')) {
      const newId = 'song-' + Date.now()
      const newSong = {
        id: newId,
        title: '제목 없음',
        content: '',
        updatedAt: Date.now()
      }
      const updated = [...songs, newSong]
      setSongs(updated)
      localStorage.setItem('leadSheetSongs', JSON.stringify(updated))
      setActiveSongId(newId)
      localStorage.setItem('leadSheetActiveSongId', newId)
      setInputText('')
      setCurrentPage(0)
      setIsViewMode(false) // 즉시 타이핑하도록 편집 모드로 전환
    }
  }

  // 3. 곡 삭제
  const handleDeleteSong = () => {
    if (songs.length <= 1) {
      if (window.confirm('마지막 곡입니다. 삭제하고 빈 곡으로 초기화할까요?')) {
        const resetId = 'song-' + Date.now()
        const emptySong = {
          id: resetId,
          title: '제목 없음',
          content: '',
          updatedAt: Date.now()
        }
        const list = [emptySong]
        setSongs(list)
        localStorage.setItem('leadSheetSongs', JSON.stringify(list))
        setActiveSongId(resetId)
        localStorage.setItem('leadSheetActiveSongId', resetId)
        setInputText('')
        setCurrentPage(0)
      }
      return
    }

    if (window.confirm('현재 보고 있는 곡을 목록에서 정말 삭제하시겠습니까?')) {
      const filtered = songs.filter(s => s.id !== activeSongId)
      setSongs(filtered)
      localStorage.setItem('leadSheetSongs', JSON.stringify(filtered))
      
      const nextActiveId = filtered[0].id
      setActiveSongId(nextActiveId)
      localStorage.setItem('leadSheetActiveSongId', nextActiveId)
      
      setInputText(filtered[0].content)
      setCurrentPage(0)
    }
  }

  // 4. 곡 순서 변경
  const handleMoveSong = (index, direction, event) => {
    event.stopPropagation() // 아이템 탭에 의한 곡 로드 차단
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= songs.length) return

    const updated = [...songs]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp

    setSongs(updated)
    localStorage.setItem('leadSheetSongs', JSON.stringify(updated))
  }

  // 5. 곡 선택 로드
  const handleSelectSong = (songId) => {
    const selected = songs.find(s => s.id === songId)
    if (!selected) return

    setActiveSongId(songId)
    localStorage.setItem('leadSheetActiveSongId', songId)
    setInputText(selected.content)
    setCurrentPage(0)
    setIsListOpen(false) // 서랍 닫기
  }

  const showFocusMode = isFocusMode || isFullscreen

  return (
    <div ref={containerRef} className={`lead-sheet-container ${showFocusMode ? 'is-focus-mode' : ''}`}>
      {/* 상단 헤더 바 - 집중 모드(전체화면)에서는 숨김 */}
      {!showFocusMode && (
        <header className="lead-sheet-header">
          <h1 className="lead-sheet-title">LEAD SHEET</h1>
          <div className="lead-sheet-controls">
            {/* 곡 목록 서랍 열기 버튼 */}
            <button 
              type="button" 
              className="lead-sheet-btn"
              onClick={() => setIsListOpen(true)}
              title="곡 목록 열기"
            >
              목록
            </button>
            
            <button 
              type="button" 
              className="lead-sheet-btn"
              onClick={zoomOut}
              disabled={fontSize <= 14}
              title="글자 크기 축소"
            >
              A-
            </button>
            <button 
              type="button" 
              className="lead-sheet-btn"
              onClick={zoomIn}
              disabled={fontSize >= 48}
              title="글자 크기 확대"
            >
              A+
            </button>
            
            <button 
              type="button" 
              className="lead-sheet-btn"
              onClick={toggleFullscreen}
              title="전체화면 토글"
            >
              전체
            </button>

            <button 
              type="button" 
              className={`lead-sheet-btn ${isViewMode ? 'lead-sheet-btn-primary' : ''}`}
              onClick={() => setIsViewMode(!isViewMode)}
            >
              {isViewMode ? '편집' : '완료'}
            </button>
          </div>
        </header>
      )}

      {/* 집중 모드(전체화면) 시 우측 상단 플로팅 컨트롤 */}
      {showFocusMode && isViewMode && (
        <div className="lead-sheet-focus-controls" onClick={(e) => e.stopPropagation()}>
          <button 
            type="button" 
            className="lead-sheet-btn"
            onClick={zoomOut}
            disabled={fontSize <= 14}
          >
            A-
          </button>
          <button 
            type="button" 
            className="lead-sheet-btn"
            onClick={zoomIn}
            disabled={fontSize >= 48}
          >
            A+
          </button>
          <button 
            type="button" 
            className="lead-sheet-btn lead-sheet-btn-primary"
            onClick={toggleFullscreen}
          >
            해제
          </button>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="lead-sheet-content-area">
        {isViewMode ? (
          <>
            {/* 보기 모드: 텍스트 렌더링 및 클릭 오버레이 */}
            <div 
              className="lead-sheet-viewer"
              style={{ fontSize: `${fontSize}px` }}
            >
              {renderRichText(pages[activePage])}
            </div>

            {/* 좌우 절반 터치 네비게이션 레이어 */}
            <div className="lead-sheet-touch-container">
              <div 
                className="lead-sheet-touch-zone" 
                onClick={handlePrevPage}
                title="이전 페이지 (화면 왼쪽 터치)"
              />
              <div 
                className="lead-sheet-touch-zone" 
                onClick={handleNextPage}
                title="다음 페이지 (화면 오른쪽 터치)"
              />
            </div>
          </>
        ) : (
          /* 편집 모드: 입력 텍스트아레아 + 하단 조작기 */
          <div className="lead-sheet-editor-container">
            <textarea
              className="lead-sheet-textarea"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                setCurrentPage(0)
              }}
              placeholder="여기에 가사와 코드를 입력하세요. 첫 줄은 곡 제목이 됩니다.&#10;--- 구분선을 넣으면 페이지가 분할됩니다."
            />
            <div className="lead-sheet-editor-actions" onClick={(e) => e.stopPropagation()}>
              <p className="lead-sheet-editor-help">
                💡 첫 줄은 곡 제목이 됩니다. <strong>---</strong> 구분선으로 페이지를 나눕니다.
              </p>
              <div className="lead-sheet-editor-buttons">
                <button 
                  type="button" 
                  className="lead-sheet-btn lead-sheet-group-btn"
                  onClick={groupSections}
                  title="섹션들을 16줄 기준으로 자동 묶기"
                >
                  묶기
                </button>
                <button 
                  type="button" 
                  className="lead-sheet-btn lead-sheet-btn-primary lead-sheet-group-btn"
                  onClick={handleSaveSong}
                  title="현재 변경 내용 저장"
                >
                  저장
                </button>
                <button 
                  type="button" 
                  className="lead-sheet-btn lead-sheet-group-btn"
                  onClick={handleNewSong}
                  title="새로운 빈 곡 생성"
                >
                  새곡
                </button>
                <button 
                  type="button" 
                  className="lead-sheet-btn lead-sheet-btn-danger lead-sheet-group-btn"
                  onClick={handleDeleteSong}
                  title="현재 곡 삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 하단 푸터 바 */}
      <footer className="lead-sheet-footer">
        <span className="lead-sheet-page-indicator">
          PAGE {totalPages > 0 ? activePage + 1 : 0} / {totalPages} · {fontSize}px
        </span>
      </footer>

      {/* 곡 목록 서랍 패널 (Drawer) */}
      {isListOpen && (
        <div className="lead-sheet-drawer-backdrop" onClick={() => setIsListOpen(false)}>
          <aside className="lead-sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <header className="lead-sheet-drawer-header">
              <h2 className="lead-sheet-drawer-title">곡 목록</h2>
              <button 
                type="button" 
                className="lead-sheet-btn" 
                onClick={() => setIsListOpen(false)}
              >
                닫기
              </button>
            </header>
            
            <div className="lead-sheet-drawer-body">
              <ul className="lead-sheet-song-list">
                {songs.map((song, idx) => (
                  <li 
                    key={song.id} 
                    className={`lead-sheet-song-item ${song.id === activeSongId ? 'is-active' : ''}`}
                    onClick={() => handleSelectSong(song.id)}
                  >
                    <span className="lead-sheet-song-title">
                      {song.title || '제목 없음'}
                    </span>
                    <div className="lead-sheet-song-item-controls">
                      <button 
                        type="button"
                        className="lead-sheet-btn lead-sheet-song-move-btn"
                        onClick={(e) => handleMoveSong(idx, -1, e)}
                        disabled={idx === 0}
                        title="위로 이동"
                      >
                        ▲
                      </button>
                      <button 
                        type="button"
                        className="lead-sheet-btn lead-sheet-song-move-btn"
                        onClick={(e) => handleMoveSong(idx, 1, e)}
                        disabled={idx === songs.length - 1}
                        title="아래로 이동"
                      >
                        ▼
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
