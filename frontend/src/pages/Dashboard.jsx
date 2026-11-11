import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import api from '../api'
import { PageHeader, Spinner } from '../components/ui'
import { STATUS_LABEL } from '../lib'

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
