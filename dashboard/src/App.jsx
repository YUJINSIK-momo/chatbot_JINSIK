import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Settings from './pages/Settings'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export function getAuthToken() {
  return localStorage.getItem('admin_token')
}

export function setAuthToken(token) {
  localStorage.setItem('admin_token', token)
}

export function api(path, options = {}) {
  const token = getAuthToken()
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })
}

function App() {
  const [auth, setAuth] = useState(!!getAuthToken())

  useEffect(() => {
    setAuth(!!getAuthToken())
  }, [])

  return (
    <Routes>
      <Route path="/login" element={auth ? <Navigate to="/" /> : <Login onLogin={() => setAuth(true)} />} />
      <Route path="/" element={auth ? <Layout onLogout={() => setAuth(false)} /> : <Navigate to="/login" />}>
        <Route index element={<Customers />} />
        <Route path="customer/:lineUserId" element={<CustomerDetail />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
