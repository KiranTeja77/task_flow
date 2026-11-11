import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext({ success: () => {}, error: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded border bg-white px-3 py-2 text-sm shadow-sm ${
              t.type === 'error' ? 'border-red-200 text-red-700' : 'border-gray-200 text-gray-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
            />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
