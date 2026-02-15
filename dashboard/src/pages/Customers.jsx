import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../App'
import './Customers.css'

export default function Customers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await api('/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else setError('고객 목록을 불러올 수 없습니다.')
    } catch (e) {
      setError('연결 실패')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(ts) {
    if (!ts) return '-'
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return '방금'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`
    return d.toLocaleDateString('ko-KR')
  }

  if (loading) return <div className="page-loading">로딩 중...</div>
  if (error) return <div className="page-error">{error}</div>

  return (
    <div className="customers-page">
      <h1>고객 CRM</h1>
      <p className="subtitle">LINE에서 대화한 고객 목록입니다. 클릭하면 대화 내역과 메모를 확인할 수 있습니다.</p>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>아직 대화한 고객이 없습니다.</p>
          <p>LINE 봇에 메시지를 보내면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="customer-list">
          {users.map((u) => (
            <Link key={u.id} to={`/customer/${u.line_user_id}`} className="customer-card">
              <div className="customer-avatar">
                {u.picture_url ? <img src={u.picture_url} alt="" /> : '👤'}
              </div>
              <div className="customer-info">
                <span className="customer-name">{u.display_name || u.line_user_id.slice(0, 12) + '...'}</span>
                <span className="customer-id">ID: {u.line_user_id}</span>
                {u.memo && <span className="customer-memo">{u.memo}</span>}
              </div>
              <span className="customer-time">{formatDate(u.updated_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
