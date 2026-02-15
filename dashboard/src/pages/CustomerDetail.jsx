import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../App'
import './CustomerDetail.css'

export default function CustomerDetail() {
  const { lineUserId } = useParams()
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [savingMemo, setSavingMemo] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [lineUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [user?.messages])

  async function load() {
    try {
      const res = await api(`/user-detail?userId=${encodeURIComponent(lineUserId)}`)
      if (res.ok) setUser(await res.json())
      else setError('고객 정보를 불러올 수 없습니다.')
    } catch (e) {
      setError('연결 실패')
    }
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const res = await api('/send-message', {
        method: 'POST',
        body: JSON.stringify({ userId: lineUserId, message: message.trim() }),
      })
      if (res.ok) {
        setMessage('')
        load()
      } else {
        const err = await res.json()
        setError(err.error || '전송 실패')
      }
    } catch (e) {
      setError('전송 실패')
    } finally {
      setSending(false)
    }
  }

  async function saveMemo(memo) {
    setSavingMemo(true)
    try {
      const res = await api('/user-detail', {
        method: 'PATCH',
        body: JSON.stringify({ userId: lineUserId, memo }),
      })
      if (res.ok) {
        setUser((u) => (u ? { ...u, memo } : u))
      }
    } finally {
      setSavingMemo(false)
    }
  }

  if (error && !user) return <div className="page-error">{error} <Link to="/">목록으로</Link></div>
  if (!user) return <div className="page-loading">로딩 중...</div>

  return (
    <div className="customer-detail">
      <div className="detail-header">
        <Link to="/" className="back-link">← 목록</Link>
        <h1>{user.display_name || lineUserId}</h1>
        <span className="line-id">LINE ID: {lineUserId}</span>
      </div>

      <div className="detail-grid">
        <div className="chat-section">
          <div className="messages">
            {(user.messages || []).map((m) => (
              <div key={m.id} className={`msg ${m.direction}`}>
                <div className="msg-bubble">
                  <pre>{m.content}</pre>
                  <span className="msg-time">
                    {new Date(m.created_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="메시지 입력 후 전송 (LINE으로 발송됩니다)"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !message.trim()}>
              {sending ? '전송 중...' : '전송'}
            </button>
          </form>
        </div>

        <div className="memo-section">
          <h3>메모</h3>
          <textarea
            defaultValue={user.memo || ''}
            onBlur={(e) => saveMemo(e.target.value)}
            placeholder="고객 관련 메모를 입력하세요"
            disabled={savingMemo}
          />
          {savingMemo && <span className="saving">저장 중...</span>}
        </div>
      </div>
    </div>
  )
}
