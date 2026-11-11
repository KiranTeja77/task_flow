import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api'
import { AuthProvider, ProtectedRoute } from '../auth'
import { StatusBadge } from '../components/ui'
import { filterTasks, formatSystemInfo } from '../lib'
import Login from '../pages/Login'
import { ToastProvider } from '../toast'

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api')
  return { ...actual, default: { get: vi.fn().mockResolvedValue({ data: {} }), post: vi.fn() } }
})

const tasks = [
  { id: 1, title: 'Fix login bug', description: '', status: 'TODO', priority: 'HIGH', assigneeName: 'Arjun Mehta' },
  { id: 2, title: 'Write docs', description: 'API reference', status: 'DONE', priority: 'LOW', assigneeName: 'Neha Iyer' },
  { id: 3, title: 'Deploy staging', description: '', status: 'DONE', priority: 'HIGH', assigneeName: null },
]

describe('task filtering', () => {
  it('filters by status, priority and search text', () => {
    expect(filterTasks(tasks, { status: 'DONE' })).toHaveLength(2)
    expect(filterTasks(tasks, { status: 'DONE', priority: 'HIGH' })).toHaveLength(1)
    expect(filterTasks(tasks, { search: 'neha' }).map((t) => t.id)).toEqual([2])
    expect(filterTasks(tasks, {})).toHaveLength(3)
  })
})

describe('footer text', () => {
  it('formats version, build number and short commit', () => {
    expect(formatSystemInfo({ version: '1.0', buildNumber: '12', gitCommit: 'a1b2c3d4e5f6' })).toBe(
      'v1.0 · build #12 · a1b2c3d',
    )
  })
})

describe('StatusBadge', () => {
  it('shows a readable label', () => {
    render(<StatusBadge status="IN_PROGRESS" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })
})

describe('auth flow', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  function renderApp(path) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><div>Secret page</div></ProtectedRoute>} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    )
  }

  it('redirects anonymous users to the login page', () => {
    renderApp('/')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByText('Secret page')).not.toBeInTheDocument()
  })

  it('logs in and opens the protected page', async () => {
    api.get.mockResolvedValue({ data: {} })
    api.post.mockResolvedValue({
      data: { token: 't', user: { id: 1, name: 'Priya Sharma', role: 'ADMIN' } },
    })
    renderApp('/login')
    await userEvent.type(screen.getByLabelText('Email'), 'admin@taskflow.com')
    await userEvent.type(screen.getByLabelText('Password'), 'Admin@123')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('Secret page')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'admin@taskflow.com', password: 'Admin@123' })
  })
})
