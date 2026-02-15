import { useState, useEffect } from 'react'
import { api } from '../App'
import './Settings.css'

export default function Settings() {
  const [aiMode, setAiMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await api('/settings')
      if (res.ok) {
        const data = await res.json()
        setAiMode(data.ai_mode !== false)
      }
    } finally {
      setLoading(false)
    }
  }

  async function toggleMode() {
    const next = !aiMode
    setSaving(true)
    try {
      const res = await api('/settings', {
        method: 'PATCH',
        body: JSON.stringify({ ai_mode: next }),
      })
      if (res.ok) setAiMode(next)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-loading">로딩 중...</div>

  return (
    <div className="settings-page">
      <h1>설정</h1>

      <div className="setting-card">
        <h3>응답 모드</h3>
        <div className="mode-toggle">
          <button
            className={aiMode ? 'active' : ''}
            onClick={() => !aiMode && toggleMode()}
            disabled={saving}
          >
            AI 모드
          </button>
          <button
            className={!aiMode ? 'active' : ''}
            onClick={() => aiMode && toggleMode()}
            disabled={saving}
          >
            CS 모드
          </button>
        </div>
        <p className="mode-desc">
          <strong>AI 모드:</strong> 챗봇이 자동으로 액세서리 관련 답변을 합니다.<br />
          <strong>CS 모드:</strong> 고객 메시지는 DB에만 저장되고, 관리자가 대시보드에서 직접 답변합니다.
        </p>
        {saving && <span className="saving">저장 중...</span>}
      </div>
    </div>
  )
}
