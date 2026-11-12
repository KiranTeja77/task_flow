import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'
import { EmptyState, PageHeader, Spinner } from '../components/ui'
import { errorMessage } from '../lib'
import { useToast } from '../toast'

const EMPTY = { name: '', email: '', password: '', role: 'MEMBER' }

/** Admin only: list everyone and add new members or admins. */
export default function Team() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [people, setPeople] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [u, t] = await Promise.all([api.get('/users'), api.get('/tasks')])
      const byUser = {}
      t.data.forEach((task) => {
        if (task.assigneeId != null && task.status !== 'DONE') byUser[task.assigneeId] = (byUser[task.assigneeId] || 0) + 1
      })
      setPeople(u.data)
      setCounts(byUser)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!isAdmin) return <Navigate to="/" replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return setError('Name and email are required')
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setSaving(true)
    setError('')
    try {
      await api.post('/users', form)
      toast.success(`${form.role === 'ADMIN' ? 'Admin' : 'Member'} added`)
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(errorMessage(err, 'Could not add the user'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Team" subtitle={`${people.length} people`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={submit} className="card h-fit space-y-3 p-4 lg:order-2" aria-label="Add person">
          <h2 className="text-sm font-semibold">Add a person</h2>
          <div>
            <label className="label" htmlFor="u-name">Name</label>
            <input id="u-name" className="input" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label" htmlFor="u-email">Email</label>
            <input id="u-email" type="email" className="input" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label" htmlFor="u-password">Temporary password</label>
            <input id="u-password" type="password" className="input" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="u-role">Role</label>
            <select id="u-role" className="input" value={form.role} onChange={set('role')}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Adding…' : 'Add person'}
          </button>
        </form>

        <div className="card overflow-x-auto lg:order-1 lg:col-span-2">
          {loading ? (
            <Spinner label="Loading team…" />
          ) : failed ? (
            <EmptyState title="Could not load the team" action={<button className="btn-secondary" onClick={load}>Retry</button>} />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Open tasks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {people.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-gray-700">{p.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${p.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                        {p.role === 'ADMIN' ? 'Admin' : 'Member'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{counts[p.id] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
