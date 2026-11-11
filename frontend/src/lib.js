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

/** Filters tasks by status, priority and a free-text search over title/description/assignee. */
export function filterTasks(tasks, { status = '', priority = '', search = '' } = {}) {
  const q = search.trim().toLowerCase()
  return tasks.filter((t) => {
    if (status && t.status !== status) return false
    if (priority && t.priority !== priority) return false
    if (!q) return true
    return [t.title, t.description, t.assigneeName]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q))
  })
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
