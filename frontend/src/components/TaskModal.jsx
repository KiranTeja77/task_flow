import { useState } from 'react'
import api from '../api'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, errorMessage } from '../lib'
import { useToast } from '../toast'
import { Modal } from './ui'

/** Create (task = null) or edit a task. Admin only. */
export default function TaskModal({ task, users, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'TODO',
    priority: task?.priority ?? 'MEDIUM',
    assigneeId: task?.assigneeId ?? '',
    dueDate: task?.dueDate ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required')
    setSaving(true)
    setError('')
    const body = {
      ...form,
      assigneeId: form.assigneeId === '' ? null : Number(form.assigneeId),
      dueDate: form.dueDate || null,
    }
    try {
      if (task) await api.put(`/tasks/${task.id}`, body)
      else await api.post('/tasks', body)
      toast.success(task ? 'Task updated' : 'Task created')
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Could not save the task'))
      setSaving(false)
    }
  }

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="space-y-3 p-4">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" className="input" value={form.title} onChange={set('title')} autoFocus maxLength={200} />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" rows={3} className="input" value={form.description} onChange={set('description')} maxLength={2000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select id="status" className="input" value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="priority">Priority</label>
              <select id="priority" className="input" value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="assignee">Assignee</label>
              <select id="assignee" className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="due">Due date</label>
              <input id="due" type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
