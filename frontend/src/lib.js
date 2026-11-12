export const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']

export const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
export const PRIORITY_LABEL = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }

export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const UNASSIGNED = 'none'

/**
 * Filters tasks by status, priority, assignee (a user id, or UNASSIGNED) and a free-text
 * search over title/description/assignee.
 */
export function filterTasks(tasks, { status = '', priority = '', assigneeId = '', search = '' } = {}) {
  const q = search.trim().toLowerCase()
  return tasks.filter((t) => {
    if (status && t.status !== status) return false
    if (priority && t.priority !== priority) return false
    if (assigneeId === UNASSIGNED) {
      if (t.assigneeId != null) return false
    } else if (assigneeId && String(t.assigneeId) !== String(assigneeId)) {
      return false
    }
    if (!q) return true
    return [t.title, t.description, t.assigneeName]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q))
  })
}

/** Personal numbers for one user: counts per status, overdue, and open tasks sorted by due date. */
export function myStats(tasks, userId) {
  const mine = tasks.filter((t) => t.assigneeId === userId)
  const count = (s) => mine.filter((t) => t.status === s).length
  const open = mine
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31'))
  return {
    total: mine.length,
    todo: count('TODO'),
    inProgress: count('IN_PROGRESS'),
    done: count('DONE'),
    overdue: mine.filter((t) => t.overdue && t.status !== 'DONE').length,
    open,
  }
}

/** Footer text, e.g. "v1.0 · build #12 · a1b2c3d". */
export function formatSystemInfo(info) {
  if (!info) return ''
  const build = /^\d+$/.test(info.buildNumber) ? `#${info.buildNumber}` : info.buildNumber
  const commit = (info.gitCommit || '').slice(0, 7)
  return `v${info.version} · build ${build} · ${commit}`
}

export function errorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || fallback
}
