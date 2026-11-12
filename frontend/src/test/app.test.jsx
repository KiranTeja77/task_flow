import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../api'
import { AuthProvider, ProtectedRoute } from '../auth'
import { StatusBadge } from '../components/ui'
import { filterTasks, formatSystemInfo, myStats } from '../lib'
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

  it('filters by member and by unassigned', () => {
    const withIds = [
      { ...tasks[0], assigneeId: 10 },
      { ...tasks[1], assigneeId: 11 },
      { ...tasks[2], assigneeId: null },
    ]
    expect(filterTasks(withIds, { assigneeId: '10' }).map((t) => t.id)).toEqual([1])
    expect(filterTasks(withIds, { assigneeId: 'none' }).map((t) => t.id)).toEqual([3])
    expect(filterTasks(withIds, { assigneeId: '' })).toHaveLength(3)
  })
})

describe('member dashboard numbers', () => {
  it('counts only the member\'s own tasks and sorts open ones by due date', () => {
    const list = [
      { id: 1, assigneeId: 7, status: 'TODO', overdue: true, dueDate: '2026-01-02' },
      { id: 2, assigneeId: 7, status: 'IN_PROGRESS', overdue: false, dueDate: '2026-01-01' },
      { id: 3, assigneeId: 7, status: 'DONE', overdue: true, dueDate: '2025-12-01' },
      { id: 4, assigneeId: 8, status: 'TODO', overdue: true, dueDate: '2025-12-01' },
    ]
    const s = myStats(list, 7)
    expect(s).toMatchObject({ total: 3, todo: 1, inProgress: 1, done: 1, overdue: 1 })
    expect(s.open.map((t) => t.id)).toEqual([2, 1])
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
