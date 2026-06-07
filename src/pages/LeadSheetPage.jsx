import { useState, useEffect, useRef } from 'react'
import { navigate } from '../lib/router'

export default function LeadSheetPage() {
  // 1. 다중 세트리스트 그룹 상태 및 기존 단일 리스트 데이터 마이그레이션 처리
  // [데이터 구조 변경 주석]:
  // 기존 leadSheetSongs (단일 곡 목록) 구조에서 leadSheetGroups (세트리스트 그룹 목록) 구조로 확장합니다.
  // 각 그룹은 { id, name, songs: [ { id, title, content, updatedAt }, ... ], updatedAt } 구조를 가집니다.
  const [groups, setGroups] = useState(() => {
    const savedGroups = localStorage.getItem('leadSheetGroups')
    if (savedGroups) {
      return JSON.parse(savedGroups)
    }

    const defaultGroupId = 'group-default'
    const legacySongs = localStorage.getItem('leadSheetSongs')
    
    // 기존에 여러 곡 목록이 이미 들어있었다면 "기본 세트리스트" 그룹으로 마이그레이션
    if (legacySongs) {
      try {
        const parsedSongs = JSON.parse(legacySongs)
        if (Array.isArray(parsedSongs) && parsedSongs.length > 0) {
          const defaultGroup = {
            id: defaultGroupId,
            name: '기본 세트리스트',
            songs: parsedSongs,
            updatedAt: Date.now()
          }
          const initialList = [defaultGroup]
          localStorage.setItem('leadSheetGroups', JSON.stringify(initialList))
          localStorage.setItem('leadSheetActiveGroupId', defaultGroupId)
          return initialList
        }
      } catch (e) {
        console.error('기존 단일 곡 목록 데이터 마이그레이션 오류:', e)
      }
    }

    // 기존 데이터가 아예 없는 경우: 기본 세트리스트에 빈 곡 하나를 넣어 초기 설정
    const defaultGroup = {
      id: defaultGroupId,
      name: '기본 세트리스트',
      songs: [
        {
          id: 'song-initial',
          title: '제목 없음',
          content: '',
          updatedAt: Date.now()
        }
      ],
      updatedAt: Date.now()
    }
    const initialList = [defaultGroup]
    localStorage.setItem('leadSheetGroups', JSON.stringify(initialList))
    localStorage.setItem('leadSheetActiveGroupId', defaultGroupId)
    return initialList
  })

  // 2. 활성화된 세트리스트 그룹 ID 상태
  const [activeGroupId, setActiveGroupId] = useState(() => {
    return localStorage.getItem('leadSheetActiveGroupId') || 'group-default'
  })

  // 현재 활성화된 그룹 객체 정보 추출
  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0]

  // 3. 활성화된 곡 ID 상태 (현재 그룹 내의 곡들 중에서 검증)
  const [activeSongId, setActiveSongId] = useState(() => {
    const savedActiveSongId = localStorage.getItem('leadSheetActiveSongId')
    const hasSong = activeGroup.songs.some(s => s.id === savedActiveSongId)
    return hasSong ? savedActiveSongId : (activeGroup.songs[0]?.id || '')
  })

  // 현재 활성화된 곡 정보 추출
  const activeSong = activeGroup.songs.find(s => s.id === activeSongId) || activeGroup.songs[0]

  // 4. 현재 에디터/뷰어 텍스트 상태
  const [inputText, setInputText] = useState(() => {
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
  const [isListOpen, setIsListOpen] = useState(false) // 목록 서랍 오픈 상태
  
  const containerRef = useRef(null)

  // 텍스트를 --- 구분자로 파싱하여 페이지 리스트 생성
  const pages = inputText
    .split(/\n?---\n?/)
    .map(p => p.trim())
    .filter(Boolean)

  // 전체 페이지 수가 변경되어 현재 페이지 범위를 벗어날 때 보정
  const totalPages = pages.length || 1
  const activePage = Math.min(currentPage, totalPages - 1)

  // LocalStorage 조절 동기화
  useEffect(() => {
    localStorage.setItem('lead-sheet-page', activePage.toString())
  }, [activePage])

  useEffect(() => {
    localStorage.setItem('lead-sheet-font-size', fontSize.toString())
  }, [fontSize])

  // 활성 곡 ID나 활성 그룹 ID가 실제로 변경되었을 때만 텍스트를 불러오도록 useRef로 관리 (순서 변경 등으로 groups가 갱신될 때 덮어쓰기 방지)
  const prevActiveSongIdRef = useRef(null)
  const prevActiveGroupIdRef = useRef(null)

  useEffect(() => {
    const isSongChanged = prevActiveSongIdRef.current !== activeSongId
    const isGroupChanged = prevActiveGroupIdRef.current !== activeGroupId

    prevActiveSongIdRef.current = activeSongId
    prevActiveGroupIdRef.current = activeGroupId

    // 첫 로드(Ref가 null인 상태)이거나 activeSongId, activeGroupId가 변경되었을 때만 텍스트 갱신
    if (isSongChanged || isGroupChanged) {
      const currentSong = activeGroup.songs.find(s => s.id === activeSongId)
      if (currentSong) {
        setInputText(currentSong.content)
      } else {
        // 그룹이 바뀌면서 곡 ID 매핑이 끊긴 경우 첫 곡으로 복구
        const firstSong = activeGroup.songs[0]
        if (firstSong) {
          setActiveSongId(firstSong.id)
          localStorage.setItem('leadSheetActiveSongId', firstSong.id)
          setInputText(firstSong.content)
        } else {
          setInputText('')
        }
      }
    }
  }, [activeSongId, activeGroupId, groups, activeGroup])

  // Fullscreen 상태 모니터링
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

  // --- 비즈니스 로직 헬퍼 ---

  // 1. 첫 번째 줄에서 공백 제외 제목 추출
  const getSongTitle = (content) => {
    const firstLine = content.split('\n')[0]?.trim()
    return firstLine ? firstLine : '제목 없음'
  }

  // 2. 동기식 곡 저장 처리 로직
  const saveActiveSongContent = (groupsList, textContent) => {
    const title = getSongTitle(textContent)
    const updated = groupsList.map(g => {
      if (g.id === activeGroupId) {
        const updatedSongs = g.songs.map(song => {
          if (song.id === activeSongId) {
            return {
              ...song,
              title,
              content: textContent,
              updatedAt: Date.now()
            }
          }
          return song
        })
        return {
          ...g,
          songs: updatedSongs,
          updatedAt: Date.now()
        }
      }
      return g
    })
    setGroups(updated)
    localStorage.setItem('leadSheetGroups', JSON.stringify(updated))
    return updated
  }

  // 3. 미저장 변경 검출 및 저장 여부 확인 (confirm 활용)
  const checkUnsavedAndConfirm = (groupsList, actionName) => {
    const currentGroup = groupsList.find(g => g.id === activeGroupId) || activeGroup
    const activeSong = currentGroup.songs.find(s => s.id === activeSongId)
    let finalGroupsList = groupsList
    
    if (activeSong && inputText !== activeSong.content) {
      const title = getSongTitle(inputText)
      if (window.confirm(`"${title}" 곡의 변경 사항이 저장되지 않았습니다.\n${actionName} 전에 저장하시겠습니까?\n(취소를 누르면 변경 사항이 폐기됩니다.)`)) {
        finalGroupsList = saveActiveSongContent(groupsList, inputText)
      }
    }
    return finalGroupsList
  }

  // --- 곡 관련 조작 ---

  // 곡 저장 (저장 버튼 클릭용)
  const handleSaveSong = () => {
    const title = getSongTitle(inputText)
    saveActiveSongContent(groups, inputText)
    alert('곡 저장 완료: ' + title)
  }

  // 새 곡 생성
  const handleNewSong = () => {
    const currentGroups = checkUnsavedAndConfirm(groups, '새 곡 생성')

    if (window.confirm('새 곡을 생성할까요?')) {
      const newId = 'song-' + Date.now()
      const newSong = {
        id: newId,
        title: '제목 없음',
        content: '',
        updatedAt: Date.now()
      }
      
      const updated = currentGroups.map(g => {
        if (g.id === activeGroupId) {
          return {
            ...g,
            songs: [...g.songs, newSong],
            updatedAt: Date.now()
          }
        }
        return g
      })
      setGroups(updated)
      localStorage.setItem('leadSheetGroups', JSON.stringify(updated))
      setActiveSongId(newId)
      localStorage.setItem('leadSheetActiveSongId', newId)
      setInputText('')
      setCurrentPage(0)
      setIsViewMode(false)
    }
  }

  // 곡 삭제
  const handleDeleteSong = () => {
    const activeSong = activeGroup.songs.find(s => s.id === activeSongId)
    const songTitle = activeSong ? (activeSong.title || '제목 없음') : '현재 곡'

    if (activeGroup.songs.length <= 1) {
      if (window.confirm(`"${songTitle}" 곡은 현재 그룹의 마지막 곡입니다. 정말 삭제하고 빈 곡으로 초기화할까요?`)) {
        const resetId = 'song-' + Date.now()
        const emptySong = {
          id: resetId,
          title: '제목 없음',
          content: '',
          updatedAt: Date.now()
        }
        const updated = groups.map(g => {
          if (g.id === activeGroupId) {
            return {
              ...g,
              songs: [emptySong],
              updatedAt: Date.now()
            }
          }
          return g
        })
        setGroups(updated)
        localStorage.setItem('leadSheetGroups', JSON.stringify(updated))
        setActiveSongId(resetId)
        localStorage.setItem('leadSheetActiveSongId', resetId)
        setInputText('')
        setCurrentPage(0)
        setIsViewMode(false) // 즉시 텍스트를 채우도록 에디터 전환
      }
      return
    }

    if (window.confirm(`"${songTitle}" 곡을 정말 목록에서 삭제하시겠습니까?`)) {
      const filteredSongs = activeGroup.songs.filter(s => s.id !== activeSongId)
      const updated = groups.map(g => {
        if (g.id === activeGroupId) {
          return {
            ...g,
            songs: filteredSongs,
            updatedAt: Date.now()
          }
        }
        return g
      })
      setGroups(updated)
      localStorage.setItem('leadSheetGroups', JSON.stringify(updated))
      
      const nextActiveId = filteredSongs[0].id
      setActiveSongId(nextActiveId)
      localStorage.setItem('leadSheetActiveSongId', nextActiveId)
      setInputText(filteredSongs[0].content)
      setCurrentPage(0)
    }
  }

  // 곡 순서 변경
  const handleMoveSong = (index, direction, event) => {
    event.stopPropagation() // 아이템 탭에 의한 곡 선택 오작동 차단
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= activeGroup.songs.length) return

    const updatedSongs = [...activeGroup.songs]
    const temp = updatedSongs[index]
    updatedSongs[index] = updatedSongs[targetIdx]
    updatedSongs[targetIdx] = temp

    const updated = groups.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          songs: updatedSongs,
          updatedAt: Date.now()
        }
      }
      return g
    })
    setGroups(updated)
    localStorage.setItem('leadSheetGroups', JSON.stringify(updated))
  }

  // 곡 선택 로드
  const handleSelectSong = (songId) => {
    if (songId === activeSongId) {
      setIsListOpen(false)
      return
    }

    const currentGroups = checkUnsavedAndConfirm(groups, '곡 이동')
    const currentActiveGroup = currentGroups.find(g => g.id === activeGroupId) || activeGroup
    const selected = currentActiveGroup.songs.find(s => s.id === songId)
    if (!selected) return

    setActiveSongId(songId)
    localStorage.setItem('leadSheetActiveSongId', songId)
    setInputText(selected.content)
    setCurrentPage(0)
    setIsListOpen(false)
  }

  // --- 세트리스트 그룹 관련 조작 ---

  // 1. 그룹 선택 전환
  const handleSelectGroup = (groupId) => {
    if (groupId === activeGroupId) return

    const currentGroups = checkUnsavedAndConfirm(groups, '그룹 전환')
    const targetGroup = currentGroups.find(g => g.id === groupId)
    if (!targetGroup) return

    setActiveGroupId(groupId)
    localStorage.setItem('leadSheetActiveGroupId', groupId)

    // 전환된 그룹의 첫 번째 곡으로 활성 곡을 로드
    const firstSongId = targetGroup.songs[0]?.id || ''
    setActiveSongId(firstSongId)
    localStorage.setItem('leadSheetActiveSongId', firstSongId)
    setCurrentPage(0)
  }

  // 2. 새 그룹 생성
  const handleAddGroup = () => {
    const groupName = window.prompt('새 세트리스트 그룹 이름을 입력하세요:')
    if (!groupName || !groupName.trim()) return

    const currentGroups = checkUnsavedAndConfirm(groups, '그룹 생성')

    const newGroupId = 'group-' + Date.now()
    const newGroup = {
      id: newGroupId,
      name: groupName.trim(),
      songs: [
        {
          id: 'song-' + Date.now(),
          title: '제목 없음',
          content: '',
          updatedAt: Date.now()
        }
      ],
      updatedAt: Date.now()
    }

    const updated = [...currentGroups, newGroup]
    setGroups(updated)
    localStorage.setItem('leadSheetGroups', JSON.stringify(updated))

    setActiveGroupId(newGroupId)
    localStorage.setItem('leadSheetActiveGroupId', newGroupId)
    
    const newSongId = newGroup.songs[0].id
    setActiveSongId(newSongId)
    localStorage.setItem('leadSheetActiveSongId', newSongId)
    
    setInputText('')
    setCurrentPage(0)
    setIsViewMode(false) // 즉시 타이핑하도록 에디터 모드로 전환
  }

  // 3. 그룹 이름 변경
  const handleRenameGroup = () => {
    const currentName = activeGroup.name
    const newName = window.prompt('변경할 세트리스트 그룹 이름을 입력하세요:', currentName)
    if (!newName || !newName.trim() || newName.trim() === currentName) return

    const updated = groups.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          name: newName.trim(),
          updatedAt: Date.now()
        }
      }
      return g
    })
    setGroups(updated)
    localStorage.setItem('leadSheetGroups', JSON.stringify(updated))
  }

  // 4. 그룹 삭제
  const handleDeleteGroup = () => {
    if (groups.length <= 1) {
      alert('마지막 남은 세트리스트 그룹은 삭제할 수 없습니다.')
      return
    }

    const name = activeGroup.name
    const songCount = activeGroup.songs.length

    if (window.confirm(`"${name}" 세트리스트 그룹을 정말 삭제하시겠습니까?\n이 그룹을 삭제하면 그룹 내의 ${songCount}개 곡도 모두 삭제됩니다.`)) {
      const filtered = groups.filter(g => g.id !== activeGroupId)
      setGroups(filtered)
      localStorage.setItem('leadSheetGroups', JSON.stringify(filtered))

      // 첫 번째 남은 그룹으로 포커스
      const nextGroup = filtered[0]
      setActiveGroupId(nextGroup.id)
      localStorage.setItem('leadSheetActiveGroupId', nextGroup.id)

      const nextSongId = nextGroup.songs[0]?.id || ''
      setActiveSongId(nextSongId)
      localStorage.setItem('leadSheetActiveSongId', nextSongId)
      setInputText(nextGroup.songs[0]?.content || '')
      setCurrentPage(0)
    }
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
            
            {/* 세트리스트 그룹 관리 영역 */}
            <div className="lead-sheet-group-selector-section" onClick={(e) => e.stopPropagation()}>
              <span className="lead-sheet-group-label">세트리스트 그룹</span>
              <div className="lead-sheet-group-controls">
                <select 
                  className="lead-sheet-group-select"
                  value={activeGroupId}
                  onChange={(e) => handleSelectGroup(e.target.value)}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <div className="lead-sheet-group-btn-group">
                  <button 
                    type="button" 
                    className="lead-sheet-btn lead-sheet-group-action-btn"
                    onClick={handleAddGroup}
                    title="새 그룹 추가"
                  >
                    +
                  </button>
                  <button 
                    type="button" 
                    className="lead-sheet-btn lead-sheet-group-action-btn"
                    onClick={handleRenameGroup}
                    title="그룹 이름 변경"
                  >
                    ✏️
                  </button>
                  <button 
                    type="button" 
                    className="lead-sheet-btn lead-sheet-group-action-btn lead-sheet-btn-danger"
                    onClick={handleDeleteGroup}
                    disabled={groups.length <= 1}
                    title="그룹 삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
            
            <div className="lead-sheet-drawer-body">
              <ul className="lead-sheet-song-list">
                {activeGroup.songs.map((song, idx) => (
                  <li 
                    key={song.id} 
                    className={`lead-sheet-song-item ${song.id === activeSongId ? 'is-active' : ''}`}
                  >
                    <span 
                      className="lead-sheet-song-title"
                      onClick={() => handleSelectSong(song.id)}
                    >
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
                        disabled={idx === activeGroup.songs.length - 1}
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
