      <button
        type="button"
        className="scheduler-panel scheduler-push-panel scheduler-setting-card"
        onClick={() => setIsGoogleModalOpen(true)}
      >
        <div className="scheduler-section-head">
          <div>
            <p className="scheduler-section-label">Google 연동</p>
          </div>
          <div className={`scheduler-count-pill ${isGoogleConnected() ? 'is-ready' : ''}`}>
            {isGoogleConnected() ? '연결됨' : '연결 필요'}
          </div>
        </div>
        {!isGoogleConnected() && (
          <p className="scheduler-setting-subtitle">
            연결하면 일정 동기화와 백업을 사용할 수 있어요.
          </p>
        )}
      </button>

      {isGoogleModalOpen && (
        <div className="scheduler-sheet-backdrop scheduler-modal-backdrop" onClick={() => setIsGoogleModalOpen(false)}>
          <div className="scheduler-modal" onClick={e => e.stopPropagation()}>
            <div className="scheduler-section-head" style={{ marginBottom: '1rem' }}>
              <p className="scheduler-section-label" style={{ marginBottom: 0 }}>Google 연동</p>
              <button type="button" className="soft-button" style={{ minHeight: '30px', padding: '0.4rem 0.8rem' }} onClick={() => setIsGoogleModalOpen(false)}>닫기</button>
            </div>
            
            <div className="scheduler-modal-actions stack">
              <button
                type="button"
                className="scheduler-modal-btn"
                onClick={() => connectGoogleCalendar(getOrCreatePushDeviceId())}
              >
                {isGoogleConnected() ? 'Google 계정 다시 연결' : 'Google 계정 연결'}
              </button>
              <button
                type="button"
                className="scheduler-modal-btn secondary"
                onClick={async () => {
                  if (!isGoogleConnected()) {
                    setGoogleStatus('Google 계정을 먼저 연결해 주세요.')
                    return
                  }
                  try {
                    setGoogleStatus('Google Calendar 일정 생성 중...')
                    const now = new Date()
                    const end = new Date(now.getTime() + 60 * 60 * 1000)
                    await createGoogleCalendarEvent(getOrCreatePushDeviceId(), {
                      summary: '테스트 일정',
                      location: '서울 지점',
                      description: 'Gemini CLI를 통한 테스트 일정입니다.',
                      startAt: now.toISOString(),
                      endAt: end.toISOString(),
                    })
                    setGoogleStatus('일정을 생성했어요.')
                  } catch (error) {
                    setGoogleStatus(`오류: ${error.message}`)
                    if (error.message?.includes('not connected') || error.message?.includes('refresh token') || error.message?.includes('insufficient')) {
                      disconnectGoogleCalendar()
                    }
                  }
                }}
              >
                테스트 일정 추가
              </button>
              <button
                type="button"
                className="scheduler-modal-btn secondary"
                onClick={async () => {
                  if (!isGoogleConnected()) {
                    setGoogleStatus('Google 계정을 먼저 연결해 주세요.')
                    return
                  }
                  try {
                    setGoogleStatus('Google Drive에 백업 중...')
                    const result = await triggerGoogleDriveBackup(getOrCreatePushDeviceId(), 'full')
                    setGoogleStatus(`백업 완료: ${result.fileName}`)
                    
                    // Log to Google Sheets
                    appendGoogleSheetsLog(getOrCreatePushDeviceId(), 'backup_logs', [
                      new Date().toISOString(),
                      'backup_completed',
                      'full',
                      result.fileName || '',
                      result.fileId || '',
                      'success',
                      JSON.stringify(result.metadata?.counts || {}),
                      ''
                    ])
                  } catch (error) {
                    setGoogleStatus(`오류: ${error.message}`)
                    if (error.message?.includes('not connected') || error.message?.includes('refresh token') || error.message?.includes('insufficient')) {
                      disconnectGoogleCalendar()
                    }
                  }
                }}
              >
                수동 백업 (Drive)
              </button>
            </div>
            {googleStatus && (
              <p className={`scheduler-google-status ${googleStatus.includes('오류') ? 'error' : 'success'}`} style={{ marginTop: '1rem', marginBottom: 0 }}>
                {googleStatus}
              </p>
            )}
          </div>
        </div>
      )}
