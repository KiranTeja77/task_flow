import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import api, { loadAuth, saveAuth } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth)

  const finish = useCallback((data) => {
    saveAuth(data)
    setAuth(data)
  }, [])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      finish(data)
    },
    [finish],
  )

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await api.post('/auth/register', { name, email, password })
      finish(data)
    },
    [finish],
  )

  const logout = useCallback(() => finish(null), [finish])

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      isAdmin: auth?.user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [auth, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
