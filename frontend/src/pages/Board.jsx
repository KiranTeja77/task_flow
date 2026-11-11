import { useState } from 'react'
import { EmptyState, PageHeader, PriorityBadge, Spinner } from '../components/ui'
import { useTasks } from '../hooks'
import { STATUSES, STATUS_LABEL, formatDate } from '../lib'

export default function Board() {
  const { tasks, loading, failed, load, canChangeStatus, changeStatus } = useTasks()
  const [dragOver, setDragOver] = useState(null)

  if (loading) return <Spinner label="Loading board…" />
  if (failed) {
    return <EmptyState title="Could not load the board" action={<button className="btn-secondary" onClick={load}>Retry</button>} />
  }

  function onDrop(e, status) {
    e.preventDefault()
    setDragOver(null)
    const task = tasks.find((t) => t.id === Number(e.dataTransfer.getData('text/plain')))
    if (task && canChangeStatus(task)) changeStatus(task, status)
  }

  return (
    <div>
      <PageHeader title="Board" subtitle="Change a card's status to move it between columns" />
      <div className="grid gap-4 md:grid-cols-3">
        {STATUSES.map((status) => {
          const items = tasks.filter((t) => t.status === status)
          return (
            <section
              key={status}
              className={`rounded-md border bg-gray-100/70 p-2 ${dragOver === status ? 'border-indigo-400' : 'border-gray-200'}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(status)
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDrop(e, status)}
              aria-label={STATUS_LABEL[status]}
            >
              <h2 className="flex items-center justify-between px-1.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {STATUS_LABEL[status]}
                <span className="rounded bg-white px-1.5 py-0.5 text-xs font-medium text-gray-500">{items.length}</span>
              </h2>
              <div className="mt-1 space-y-2">
                {items.length === 0 && <p className="px-1.5 py-6 text-center text-xs text-gray-400">No tasks here</p>}
                {items.map((t) => {
                  const editable = canChangeStatus(t)
                  return (
                    <article
                      key={t.id}
                      draggable={editable}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', String(t.id))}
                      className={`rounded border border-gray-200 bg-white p-3 ${editable ? 'cursor-grab' : ''}`}
                    >
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <PriorityBadge priority={t.priority} />
                        <span className={`text-xs ${t.overdue ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                          {formatDate(t.dueDate)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                        <span className="truncate text-xs text-gray-600">{t.assigneeName || 'Unassigned'}</span>
                        <select
                          className="rounded border border-gray-200 bg-white px-1 py-0.5 text-xs disabled:opacity-50"
                          value={t.status}
                          disabled={!editable}
                          onChange={(e) => changeStatus(t, e.target.value)}
                          aria-label={`Status of ${t.title}`}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
