import { Outlet, NavLink } from 'react-router-dom'
import './Layout.css'

export default function Layout({ onLogout }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo">◆ 액세서리 봇</span>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            고객 CRM
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            설정
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-btn">로그아웃</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
