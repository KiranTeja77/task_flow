import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import api from '../api'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { EmptyState, PageHeader, PriorityBadge, Spinner } from '../components/ui'
import { useTasks } from '../hooks'
import { STATUSES, STATUS_LABEL, formatDate, myStats } from '../lib'

const SPLIT_COLORS = { TODO: '#9ca3af', IN_PROGRESS: '#6366f1', DONE: '#10b981' }

function StatCard({ label, value, tone = 'text-gray-900' }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  return isAdmin ? <TeamDashboard /> : <MemberDashboard />
}

/** What a member sees: only their own work. */
function MemberDashboard() {
  const { user } = useAuth()
  const { tasks, loading, failed, canChangeStatus, changeStatus } = useTasks()

  if (loading) return <Spinner />
  if (failed) return <p className="text-sm text-red-600">Could not load the dashboard.</p>

  const s = myStats(tasks, user.id)
  const split = STATUSES.map((k) => ({ key: k, label: STATUS_LABEL[k], count: { TODO: s.todo, IN_PROGRESS: s.inProgress, DONE: s.done }[k] }))

  return (
    <div>
      <PageHeader title={`Hi, ${user.name.split(' ')[0]}`} subtitle={`You have ${s.total} task${s.total === 1 ? '' : 's'} assigned`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" data-testid="my-stats">
        <StatCard label="To do" value={s.todo} />
        <StatCard label="In progress" value={s.inProgress} />
        <StatCard label="Done" value={s.done} />
        <StatCard label="Overdue" value={s.overdue} tone={s.overdue > 0 ? 'text-red-600' : 'text-gray-900'} />
      </div>

      {s.total === 0 ? (
        <div className="card mt-6">
          <EmptyState title="Nothing assigned to you yet" hint="When a manager assigns you a task it will show up here." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <section className="card lg:col-span-3">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold">Up next</h2>
              <Link to="/tasks" className="text-xs text-indigo-600 hover:underline">All tasks</Link>
            </div>
            {s.open.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">All caught up — nothing open.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {s.open.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{t.title}</div>
                      <div className={`text-xs ${t.overdue ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                        {t.overdue ? 'Overdue · ' : 'Due '}{formatDate(t.dueDate)}
                      </div>
                    </div>
                    <PriorityBadge priority={t.priority} />
                    {canChangeStatus(t) && (
                      <select
                        className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs"
                        value={t.status}
                        onChange={(e) => changeStatus(t, e.target.value)}
                        aria-label={`Status of ${t.title}`}
                      >
                        {STATUSES.map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
                      </select>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-4 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold">My status split</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={split} dataKey="count" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="#fff">
                    {split.map((x) => <Cell key={x.key} fill={SPLIT_COLORS[x.key]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #e5e7eb', boxShadow: 'none' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function TeamDashboard() {
  const [stats, setStats] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data)).catch(() => setFailed(true))
  }, [])

  if (failed) return <p className="text-sm text-red-600">Could not load the dashboard.</p>
  if (!stats) return <Spinner />

  const split = stats.statusSplit.map((s) => ({ ...s, label: STATUS_LABEL[s.name], key: s.name }))

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of work across the team" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total tasks" value={stats.total} />
        <StatCard label="In progress" value={stats.inProgress} />
        <StatCard label="Done" value={stats.done} />
        <StatCard label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? 'text-red-600' : 'text-gray-900'} />
      </div>

      {stats.total === 0 ? (
        <div className="card mt-6 py-12 text-center text-sm text-gray-500">No tasks yet — create one to see charts here.</div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <section className="card p-4 lg:col-span-3">
            <h2 className="mb-3 text-sm font-semibold">Tasks per member</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.perMember} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #e5e7eb', boxShadow: 'none' }} />
                  <Bar dataKey="count" name="Tasks" fill="#6366f1" radius={[2, 2, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card p-4 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold">Status split</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={split} dataKey="count" nameKey="label" innerRadius={60} outerRadius={95} paddingAngle={2} stroke="#fff">
                    {split.map((s) => <Cell key={s.key} fill={SPLIT_COLORS[s.key]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #e5e7eb', boxShadow: 'none' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
