import { useEffect } from 'react'
import { PRIORITY_LABEL, STATUS_LABEL } from '../lib'

const STATUS_STYLE = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  DONE: 'bg-emerald-50 text-emerald-700',
}

const PRIORITY_STYLE = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-700',
}

const base = 'inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap'

export function StatusBadge({ status }) {
  return <span className={`${base} ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={`${base} ${PRIORITY_STYLE[priority]}`}>{PRIORITY_LABEL[priority]}</span>
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      {label}
    </div>
  )
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Modal({ title, onClose, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-gray-900/40 p-4 pt-16"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full ${width} rounded-md border border-gray-200 bg-white`} role="dialog" aria-label={title}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
