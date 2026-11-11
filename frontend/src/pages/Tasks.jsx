import { useMemo, useState } from 'react'
import api from '../api'
import { useAuth } from '../auth'
import TaskModal from '../components/TaskModal'
import { EmptyState, Modal, PageHeader, PriorityBadge, Spinner, StatusBadge } from '../components/ui'
import { useTasks } from '../hooks'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, errorMessage, filterTasks, formatDate } from '../lib'
import { useToast } from '../toast'

export default function Tasks() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const { tasks, users, loading, failed, load, canChangeStatus, changeStatus } = useTasks()
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null)

  const visible = useMemo(() => filterTasks(tasks, filters), [tasks, filters])
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const hasFilters = filters.status || filters.priority || filters.search

  async function confirmDelete() {
    try {
      await api.delete(`/tasks/${deleting.id}`)
      toast.success('Task deleted')
      setDeleting(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, 'Could not delete the task'))
    }
  }

  const newButton = isAdmin && (
    <button className="btn-primary" onClick={() => setEditing(null)}>New task</button>
  )

  return (
    <div>
      <PageHeader title="Tasks" subtitle={`${tasks.length} total`}>{newButton}</PageHeader>

      <div className="mb-3 flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search tasks…" value={filters.search} onChange={set('search')} aria-label="Search tasks" />
        <select className="input w-40" value={filters.status} onChange={set('status')} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select className="input w-40" value={filters.priority} onChange={set('priority')} aria-label="Filter by priority">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <Spinner label="Loading tasks…" />
        ) : failed ? (
          <EmptyState title="Could not load tasks" hint="Check your connection and try again." action={<button className="btn-secondary" onClick={load}>Retry</button>} />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet — create one"
            hint={isAdmin ? 'Tasks you create will show up here.' : 'Your manager has not created any tasks yet.'}
            action={newButton}
          />
        ) : visible.length === 0 ? (
          <EmptyState title="No tasks match your filters" hint="Try a different search or clear the filters." action={hasFilters && <button className="btn-secondary" onClick={() => setFilters({ status: '', priority: '', search: '' })}>Clear filters</button>} />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Assignee</th>
                <th className="px-4 py-2">Due</th>
                {isAdmin && <th className="px-4 py-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="max-w-xs px-4 py-2.5">
                    <div className="truncate font-medium">{t.title}</div>
                    {t.description && <div className="truncate text-xs text-gray-500">{t.description}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    {canChangeStatus(t) ? (
                      <select
                        className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs"
                        value={t.status}
                        onChange={(e) => changeStatus(t, e.target.value)}
                        aria-label={`Status of ${t.title}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    ) : (
                      <StatusBadge status={t.status} />
                    )}
                  </td>
                  <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-2.5 text-gray-700">{t.assigneeName || <span className="text-gray-400">Unassigned</span>}</td>
                  <td className={`whitespace-nowrap px-4 py-2.5 ${t.overdue ? 'font-medium text-red-600' : 'text-gray-700'}`}>
                    {formatDate(t.dueDate)}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <button className="text-indigo-600 hover:underline" onClick={() => setEditing(t)}>Edit</button>
                      <button className="ml-3 text-red-600 hover:underline" onClick={() => setDeleting(t)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== undefined && (
        <TaskModal
          task={editing}
          users={users}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined)
            load()
          }}
        />
      )}

      {deleting && (
        <Modal title="Delete task" onClose={() => setDeleting(null)} width="max-w-sm">
          <p className="p-4 text-sm text-gray-700">
            Delete <span className="font-medium">{deleting.title}</span>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
            <button className="btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
            <button className="btn-danger" onClick={confirmDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
