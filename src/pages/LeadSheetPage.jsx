import { useState, useEffect, useRef } from 'react'
import { navigate } from '../lib/router'
import { supabase } from '../lib/supabase'
import { signInWithGoogle, signOut, getCurrentUser, subscribeAuthChanges } from '../lib/auth'

// 자동 페이지 분할(섹션 묶기) 시 한 페이지당 최대 허용 가사/코드 줄 수 기준
const AUTO_PAGE_MAX_LINES = 28

export default function LeadSheetPage() {
  // 1. 다중 세트리스트 그룹 상태 및 기존 단일 리스트 데이터 마이그레이션 처리
  // [데이터 구조 변경 주석]:
  // 기존 leadSheetSongs (단일 곡 목록) 구조에서 leadSheetGroups (세트리스트 그룹 목록) 구조로 확장합니다.
  // 각 그룹은 { id, name, songs: [ { id, title, content, updatedAt }, ... ], updatedAt } 구조를 가집니다.
  const [groups, setGroups] = useState(() => {
    const defaultGroupId = 'group-default'
    const createDefaultGroup = () => ({
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
    })

    const savedGroups = localStorage.getItem('leadSheetGroups')
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (e) {
        console.error('leadSheetGroups 로딩 및 파싱 오류:', e)
      }
    }

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

    // 기존 데이터가 아예 없거나 손상된 경우 초기화
    const defaultGroup = createDefaultGroup()
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
  const [isLocked, setIsLocked] = useState(false)

  // Fullscreen 또는 Focus Mode 해제 시 자동으로 터치 잠금(isLocked)을 해제하여 숨겨진 잠금 오동작을 원천 방지
  useEffect(() => {
    if (!isFullscreen && !isFocusMode) {
      setIsLocked(false)
    }
  }, [isFullscreen, isFocusMode])
  
  // 백업 관련 상태
  const [user, setUser] = useState(null)
  const [hasLocalBackup, setHasLocalBackup] = useState(() => {
    return !!localStorage.getItem('leadSheetGroupsBackupBeforeRestore')
  })
  
  const containerRef = useRef(null)

  // Auth 상태 변경 구독 및 로그인 확인
  useEffect(() => {
    getCurrentUser().then(setUser)

    const subscription = subscribeAuthChanges((session) => {
      setUser(session?.user || null)
    })

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [])

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
        // 미저장 초안(draft) 확인 및 복구 확인
        const draftStr = localStorage.getItem('leadSheetActiveDraft')
        let finalContent = currentSong.content
        if (draftStr) {
          try {
            const draft = JSON.parse(draftStr)
            if (
              draft.groupId === activeGroupId &&
              draft.songId === activeSongId &&
              draft.text &&
              draft.text !== currentSong.content
            ) {
              if (window.confirm('이 곡에 저장되지 않은 편집 초안이 있습니다. 복구하시겠습니까?')) {
                finalContent = draft.text
              } else {
                localStorage.removeItem('leadSheetActiveDraft')
              }
            }
          } catch (e) {
            console.error('로컬 초안 파싱 실패:', e)
          }
        }
        setInputText(finalContent)
      } else {
        // 그룹이 바뀌면서 곡 ID 매핑이 끊긴 경우 첫 곡으로 복구
        const firstSong = activeGroup.songs[0]
        if (firstSong) {
          setActiveSongId(firstSong.id)
          localStorage.setItem('leadSheetActiveSongId', firstSong.id)
          
          const draftStr = localStorage.getItem('leadSheetActiveDraft')
          let finalContent = firstSong.content
          if (draftStr) {
            try {
              const draft = JSON.parse(draftStr)
              if (
                draft.groupId === activeGroupId &&
                draft.songId === firstSong.id &&
                draft.text &&
                draft.text !== firstSong.content
              ) {
                if (window.confirm('이 곡에 저장되지 않은 편집 초안이 있습니다. 복구하시겠습니까?')) {
                  finalContent = draft.text
                } else {
                  localStorage.removeItem('leadSheetActiveDraft')
                }
              }
            } catch (e) {
              console.error('로컬 초안 파싱 실패:', e)
            }
          }
          setInputText(finalContent)
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

    // 설정된 기준 줄 수(AUTO_PAGE_MAX_LINES) 단위로 묶어 페이지 나누기
    const pageGroups = []
    let currentPageLines = [...headerLines]

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i]
      const secLength = 1 + sec.lines.length

      if (currentPageLines.length > 0 && currentPageLines.length + secLength > AUTO_PAGE_MAX_LINES) {
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
    // 저장 성공 시 미저장 로컬 초안(draft) 삭제
    localStorage.removeItem('leadSheetActiveDraft')

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

  // 3. 미저장 변경 검출 및 저장 여부 확인 (confirm 활용, 취소 시 전체 작업 중단)
  // 반환 값: { groupsList: 최종그룹리스트, aborted: 진행 중단 여부 }
  const checkUnsavedAndConfirm = (groupsList, actionName) => {
    const currentGroup = groupsList.find(g => g.id === activeGroupId) || activeGroup
    const activeSong = currentGroup.songs.find(s => s.id === activeSongId)
    
    if (activeSong && inputText !== activeSong.content) {
      const title = getSongTitle(inputText)
      if (window.confirm(`"${title}" 곡의 변경 사항이 저장되지 않았습니다.\n${actionName} 전에 저장하고 진행하시겠습니까?\n(취소를 누르면 해당 작업이 완전히 취소됩니다.)`)) {
        const updatedGroups = saveActiveSongContent(groupsList, inputText)
        return { groupsList: updatedGroups, aborted: false }
      } else {
        // 취소를 누르면 다음 진행 자체를 중단하도록 지시
        return { groupsList: null, aborted: true }
      }
    }
    return { groupsList, aborted: false }
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
    const { groupsList: currentGroups, aborted } = checkUnsavedAndConfirm(groups, '새 곡 생성')
    if (aborted) return

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
        // 삭제 직전 로컬 복구 버퍼 백업
        localStorage.setItem('leadSheetGroupsBackupBeforeRestore', JSON.stringify(groups))
        setHasLocalBackup(true)

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
      // 삭제 직전 로컬 복구 버퍼 백업
      localStorage.setItem('leadSheetGroupsBackupBeforeRestore', JSON.stringify(groups))
      setHasLocalBackup(true)

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

    const { groupsList: currentGroups, aborted } = checkUnsavedAndConfirm(groups, '곡 이동')
    if (aborted) return

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

    const { groupsList: currentGroups, aborted } = checkUnsavedAndConfirm(groups, '그룹 전환')
    if (aborted) return

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
    const { groupsList: currentGroups, aborted } = checkUnsavedAndConfirm(groups, '그룹 생성')
    if (aborted) return

    const groupName = window.prompt('새 세트리스트 그룹 이름을 입력하세요:')
    if (!groupName || !groupName.trim()) return

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
      // 삭제 직전 로컬 복구 버퍼 백업
      localStorage.setItem('leadSheetGroupsBackupBeforeRestore', JSON.stringify(groups))
      setHasLocalBackup(true)

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

  // --- 클라우드 백업 및 불러오기 (OAuth 구글 계정 기준) ---

  const handleSignIn = async () => {
    const { aborted } = checkUnsavedAndConfirm(groups, '구글 로그인')
    if (aborted) return

    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('로그인 에러:', err)
      alert('구글 로그인 중 에러가 발생했습니다.')
    }
  }

  const handleSignOut = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      try {
        await signOut()
        setUser(null)
        alert('로그아웃 되었습니다.')
      } catch (err) {
        console.error('로그아웃 에러:', err)
        alert('로그아웃 중 에러가 발생했습니다.')
      }
    }
  }

  const handleBackupToCloud = async () => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다.')
      return
    }

    const { groupsList: currentGroups, aborted } = checkUnsavedAndConfirm(groups, '클라우드 백업')
    if (aborted) return

    try {
      const { error } = await supabase
        .from('lead_sheet_backups')
        .upsert(
          {
            user_id: user.id,
            data: currentGroups,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error

      alert('성공적으로 클라우드 백업을 완료했습니다!')
    } catch (err) {
      console.error('백업 실패:', err)
      alert('클라우드 백업 중 오류가 발생했습니다: ' + (err.message || err))
    }
  }

  const handleRestoreFromCloud = async () => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다.')
      return
    }

    // 불러오기 전에 현재 미저장 데이터가 있는 경우, 사용자 승인 하에 저장하거나 전체 작업을 취소할 수 있도록 유도
    const { groupsList: currentGroups, aborted } = checkUnsavedAndConfirm(groups, '클라우드 불러오기')
    if (aborted) return

    try {
      // 1. 서버 백업 존재 여부 및 데이터 획득
      const { data, error } = await supabase
        .from('lead_sheet_backups')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        alert('클라우드에 저장된 백업 데이터가 없습니다.')
        return
      }

      const backupData = data.data
      const backupDate = new Date(data.updated_at).toLocaleString()

      if (!Array.isArray(backupData) || backupData.length === 0) {
        alert('백업 데이터 형식이 올바르지 않습니다.')
        return
      }

      const backupSongCount = backupData.reduce((acc, g) => acc + (g.songs?.length || 0), 0)
      const currentSongCount = currentGroups.reduce((acc, g) => acc + (g.songs?.length || 0), 0)

      const confirmMessage = `현재 기기 데이터를 클라우드 백업으로 교체할까요?\n최근 데이터는 복구용으로 임시 저장됩니다.\n\n` +
        `• 현재 기기: 곡 ${currentSongCount}개\n` +
        `• 클라우드 백업: 곡 ${backupSongCount}개 (백업 시간: ${backupDate})`

      if (window.confirm(confirmMessage)) {
        // 2. 현재 최신 데이터를 임시 백업으로 저장 (이미 저장 완료된 currentGroups를 저장함으로서 타이핑 중이던 내용까지 함께 백업됨!)
        localStorage.setItem('leadSheetGroupsBackupBeforeRestore', JSON.stringify(currentGroups))
        setHasLocalBackup(true)

        // 3. 불러온 데이터 반영
        setGroups(backupData)
        localStorage.setItem('leadSheetGroups', JSON.stringify(backupData))

        // 첫 번째 그룹의 첫 번째 곡으로 활성화
        const firstGroup = backupData[0]
        if (firstGroup) {
          setActiveGroupId(firstGroup.id)
          localStorage.setItem('leadSheetActiveGroupId', firstGroup.id)
          
          const firstSongId = firstGroup.songs[0]?.id || ''
          setActiveSongId(firstSongId)
          localStorage.setItem('leadSheetActiveSongId', firstSongId)
          setInputText(firstGroup.songs[0]?.content || '')
        }
        setCurrentPage(0)

        alert('클라우드 백업 데이터를 성공적으로 불러왔습니다!')
      }
    } catch (err) {
      console.error('복원 실패:', err)
      alert('클라우드 데이터를 불러오는 중 오류가 발생했습니다: ' + (err.message || err))
    }
  }

  const handleUndoRestore = () => {
    const backupStr = localStorage.getItem('leadSheetGroupsBackupBeforeRestore')
    if (!backupStr) {
      alert('되돌릴 로컬 백업 데이터가 없습니다.')
      return
    }

    if (window.confirm('덮어쓰기 또는 삭제 직전의 로컬 데이터로 되돌리시겠습니까?')) {
      try {
        const backupData = JSON.parse(backupStr)
        if (!Array.isArray(backupData) || backupData.length === 0) {
          throw new Error('올바르지 않은 백업 형식입니다.')
        }

        // 복구 롤백 반영
        setGroups(backupData)
        localStorage.setItem('leadSheetGroups', JSON.stringify(backupData))

        const firstGroup = backupData[0]
        if (firstGroup) {
          setActiveGroupId(firstGroup.id)
          localStorage.setItem('leadSheetActiveGroupId', firstGroup.id)
          
          const firstSongId = firstGroup.songs[0]?.id || ''
          setActiveSongId(firstSongId)
          localStorage.setItem('leadSheetActiveSongId', firstSongId)
          setInputText(firstGroup.songs[0]?.content || '')
        }
        setCurrentPage(0)

        // 로컬 백업 지우기
        localStorage.removeItem('leadSheetGroupsBackupBeforeRestore')
        setHasLocalBackup(false)

        alert('이전 로컬 데이터로 성공적으로 되돌렸습니다!')
      } catch (err) {
        console.error('롤백 실패:', err)
        alert('이전 데이터 복원 중 오류가 발생했습니다: ' + err.message)
      }
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
      {showFocusMode && (
        <div className="lead-sheet-focus-controls" onClick={(e) => e.stopPropagation()}>
          {isViewMode && (
            <>
              <span className="lead-sheet-compact-indicator">
                {totalPages > 0 ? activePage + 1 : 0}/{totalPages}
              </span>
              <button 
                type="button" 
                className={`lead-sheet-btn ${isLocked ? 'lead-sheet-btn-danger' : ''}`}
                onClick={() => setIsLocked(!isLocked)}
                style={{ marginRight: '0.5rem' }}
                title={isLocked ? '터치 잠금 해제' : '터치 잠금 (공연 모드)'}
              >
                {isLocked ? '🔒 잠김' : '🔓 풀림'}
              </button>
            </>
          )}
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
            <div 
              className={`lead-sheet-touch-container ${isLocked ? 'is-locked' : ''}`}
              style={{ 
                touchAction: 'manipulation', 
                pointerEvents: isLocked ? 'none' : 'auto' 
              }}
            >
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
                const val = e.target.value
                setInputText(val)
                setCurrentPage(0)
                // 타이핑할 때마다 초안(draft) 상태 저장
                try {
                  const draft = {
                    groupId: activeGroupId,
                    songId: activeSongId,
                    text: val,
                    updatedAt: Date.now()
                  }
                  localStorage.setItem('leadSheetActiveDraft', JSON.stringify(draft))
                } catch (err) {
                  console.error('초안 로컬 저장 실패:', err)
                }
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
      {!showFocusMode && (
        <footer className="lead-sheet-footer">
          <span className="lead-sheet-page-indicator">
            PAGE {totalPages > 0 ? activePage + 1 : 0} / {totalPages} · {fontSize}px
          </span>
        </footer>
      )}

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

            {/* 클라우드 백업 관리 영역 */}
            <div className="lead-sheet-cloud-section" onClick={(e) => e.stopPropagation()}>
              <span className="lead-sheet-group-label">클라우드 백업</span>
              {user ? (
                <div className="lead-sheet-cloud-info">
                  <span className="lead-sheet-cloud-user">{user.email}</span>
                  <div className="lead-sheet-cloud-actions">
                    <button
                      type="button"
                      className="lead-sheet-btn lead-sheet-btn-primary"
                      onClick={handleBackupToCloud}
                      title="클라우드에 세트리스트 백업"
                    >
                      백업
                    </button>
                    <button
                      type="button"
                      className="lead-sheet-btn"
                      onClick={handleRestoreFromCloud}
                      title="클라우드에서 세트리스트 복원"
                    >
                      불러오기
                    </button>
                    <button
                      type="button"
                      className="lead-sheet-btn lead-sheet-btn-danger"
                      onClick={handleSignOut}
                      title="구글 로그아웃"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              ) : (
                <div className="lead-sheet-cloud-info is-logged-out">
                  <span className="lead-sheet-cloud-guest-msg">구글 로그인 후 백업 가능</span>
                  <button
                    type="button"
                    className="lead-sheet-btn lead-sheet-btn-primary lead-sheet-cloud-login-btn"
                    onClick={handleSignIn}
                    title="구글 계정으로 로그인"
                  >
                    구글 로그인
                  </button>
                </div>
              )}
              {hasLocalBackup && (
                <div className="lead-sheet-cloud-undo-section">
                  <button
                    type="button"
                    className="lead-sheet-btn lead-sheet-btn-warning lead-sheet-undo-btn"
                    onClick={handleUndoRestore}
                    title="덮어쓰기 또는 삭제 이전 로컬 데이터로 복구"
                  >
                    🔄 실행 취소 (이전 상태 복구)
                  </button>
                </div>
              )}
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
