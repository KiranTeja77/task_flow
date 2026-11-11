import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'
import { formatSystemInfo } from '../lib'

const NAV = [
  { to: '/', label: 'Dashboard', end: true, d: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
  { to: '/tasks', label: 'Tasks', d: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01' },
  { to: '/board', label: 'Board', d: 'M4 4h5v16H4zM10 4h5v10h-5zM16 4h4v13h-4z' },
]

function Icon({ d }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export function Footer() {
  const [text, setText] = useState('')
  useEffect(() => {
    api
      .get('/system/info')
      .then((r) => setText(formatSystemInfo(r.data)))
      .catch(() => setText(''))
  }, [])
  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-2 text-xs text-gray-500" data-testid="footer">
      {text || 'TaskFlow'}
    </footer>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white md:flex">
        <div className="flex h-12 items-center gap-2 border-b border-gray-200 px-4">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-semibold text-white">
            T
          </span>
          <span className="font-semibold">TaskFlow</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded px-2.5 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon d={n.d} />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-6">
          <nav className="flex gap-3 md:hidden">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="text-sm text-gray-600">
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-gray-500">{user.role === 'ADMIN' ? 'Admin' : 'Member'}</div>
            </div>
            <button onClick={logout} className="btn-secondary">
              Log out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
