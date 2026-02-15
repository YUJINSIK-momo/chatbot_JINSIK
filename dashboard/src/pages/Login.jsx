import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, setAuthToken } from '../App'
import './Login.css'

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api('/users', { headers: { Authorization: `Bearer ${password}` } })
      if (res.ok) {
        setAuthToken(password)
        onLogin()
        navigate('/')
      } else {
        setError('비밀번호가 올바르지 않습니다.')
      }
    } catch (err) {
      setError('연결 실패. API URL을 확인하세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>◆ 액세서리 봇</h1>
        <p className="login-sub">관리자 대시보드</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            disabled={loading}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
