import { useState } from 'react'
import { buildDeterministicBase, exportDeterministicBaseJson } from '../conversationFoundation.js'

function downloadText(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  window.setTimeout(() => {
    anchor.remove()
    URL.revokeObjectURL(url)
  }, 0)
}

export function ChatHandoffCard({ onPrepare }) {
  const [basePackage, setBasePackage] = useState(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  function generateBase() {
    try {
      const prepared = onPrepare()
      const normalized = prepared?.result?.input?.normalized
      if (!prepared?.result || !normalized) {
        throw new Error('출생정보를 계산하지 못했습니다. 입력을 확인해 주세요.')
      }

      const nextBase = buildDeterministicBase({
        subjectName: normalized.subjectName,
        result: prepared.result,
        systems: prepared.systems,
        unifiedContext: prepared.unifiedContext,
      })

      setBasePackage(nextBase)
      setStatus('Base가 준비되었습니다.')
      setError('')
    } catch (generationError) {
      setBasePackage(null)
      setStatus('')
      setError(generationError.message || '출생정보를 확인한 뒤 다시 시도해 주세요.')
    }
  }

  async function copyCanonicalBase() {
    if (!basePackage) return

    try {
      await navigator.clipboard.writeText(exportDeterministicBaseJson(basePackage))
      setStatus('canonical Base를 복사했습니다.')
      setError('')
    } catch (copyError) {
      setError('복사할 수 없습니다. 브라우저의 클립보드 권한을 확인해 주세요.')
    }
  }

  function downloadMarkdown() {
    if (!basePackage) return
    downloadText('deterministic-base.md', basePackage.markdown, 'text/markdown')
    setStatus('Markdown 파일을 다운로드했습니다.')
    setError('')
  }

  return (
    <section className="prep-base-export-card" aria-labelledby="prep-base-export-title">
      <div className="prep-base-export-header">
        <div>
          <h2 id="prep-base-export-title">Base 산출물</h2>
          <p>입력한 출생정보를 복사하거나 파일로 내려받을 수 있습니다.</p>
        </div>
      </div>

      <button type="button" className="prep-base-generate-button" onClick={generateBase}>
        Base 생성
      </button>

      {error && <p className="prep-form-error" role="alert">{error}</p>}

      {basePackage && (
        <div className="prep-base-result" aria-live="polite">
          <p className="prep-base-result-summary">
            {basePackage.normalizedInput?.placeName || '대한민국'} 출생정보 Base가 준비되었습니다.
          </p>
          <div className="prep-base-actions">
            <button type="button" className="prep-base-action-button" onClick={copyCanonicalBase}>
              canonical Base 복사
            </button>
            <button type="button" className="prep-base-action-button" onClick={downloadMarkdown}>
              Markdown 다운로드
            </button>
          </div>
        </div>
      )}

      {status && <p className="prep-copy-status" role="status">{status}</p>}
    </section>
  )
}
