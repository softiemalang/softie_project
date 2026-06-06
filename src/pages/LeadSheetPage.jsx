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
  // LocalStorage에서 초기값 불러오기
  const [inputText, setInputText] = useState(() => {
    return localStorage.getItem('lead-sheet-text') ?? DEFAULT_LEAD_SHEET
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
    localStorage.setItem('lead-sheet-text', inputText)
  }, [inputText])

  useEffect(() => {
    localStorage.setItem('lead-sheet-page', activePage.toString())
  }, [activePage])

  useEffect(() => {
    localStorage.setItem('lead-sheet-font-size', fontSize.toString())
  }, [fontSize])

  // Fullscreen 상태 모니터링
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
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

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('전체화면 진입 중 오류 발생:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div ref={containerRef} className="lead-sheet-container">
      {/* 상단 헤더 바 */}
      <header className="lead-sheet-header">
        <h1 className="lead-sheet-title">Lead Sheet Page</h1>
        <div className="lead-sheet-controls">
          <button 
            type="button" 
            className="lead-sheet-btn"
            onClick={() => navigate('/')}
          >
            홈으로
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
            {isFullscreen ? '화면축소' : '전체화면'}
          </button>

          <button 
            type="button" 
            className={`lead-sheet-btn ${isViewMode ? 'lead-sheet-btn-primary' : ''}`}
            onClick={() => setIsViewMode(!isViewMode)}
          >
            {isViewMode ? '편집하기' : '완료'}
          </button>
        </div>
      </header>

      {/* 메인 텍스트 영역 */}
      <main className="lead-sheet-content-area">
        {isViewMode ? (
          <>
            {/* 보기 모드: 텍스트 렌더링 및 클릭 오버레이 */}
            <div 
              className="lead-sheet-viewer"
              style={{ fontSize: `${fontSize}px` }}
            >
              {pages[activePage] || '내용이 없습니다. 편집 버튼을 눌러 입력해주세요.'}
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
          /* 편집 모드: 입력 텍스트아레아 */
          <div className="lead-sheet-editor-container">
            <textarea
              className="lead-sheet-textarea"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value)
                // 내용 수정 시 페이지 번호 바운드 초과 방지를 위해 0페이지로 임시 리셋 처리
                setCurrentPage(0)
              }}
              placeholder="가사와 코드를 입력하세요.&#10;--- 구분선을 넣으면 페이지가 분할됩니다.&#10;&#10;예시:&#10;[Verse 1]&#10;C    G    Am&#10;하늘을 나는 기분&#10;---&#10;[Chorus]&#10;F    G    C&#10;너와 함께 있을 때"
            />
            <p className="lead-sheet-editor-help">
              💡 한글자 또는 빈 줄 단위로 가사/코드 분량을 조절해보세요. 한 페이지로 나타낼 영역 중간에 <strong>---</strong>를 작성하면 페이지가 분할됩니다.
            </p>
          </div>
        )}
      </main>

      {/* 하단 푸터 바 */}
      <footer className="lead-sheet-footer">
        <span className="lead-sheet-page-indicator">
          PAGE {totalPages > 0 ? activePage + 1 : 0} / {totalPages}
        </span>
        <span className="lead-sheet-page-indicator" style={{ fontWeight: 'normal', color: '#64748b' }}>
          크기: {fontSize}px
        </span>
      </footer>
    </div>
  )
}
