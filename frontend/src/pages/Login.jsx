import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Footer } from '../components/Layout'
import { errorMessage } from '../lib'

export default function Login() {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={location.state?.from?.pathname || '/'} replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isLogin = mode === 'login'

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isLogin) await login(form.email, form.password)
      else await register(form.name, form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Unable to reach the server'))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-indigo-600 text-sm font-semibold text-white">
              T
            </span>
            <span className="text-lg font-semibold">TaskFlow</span>
          </div>
          <form onSubmit={submit} className="card space-y-4 p-5">
            <div>
              <h1 className="text-base font-semibold">{isLogin ? 'Log in to your workspace' : 'Create an account'}</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {isLogin ? 'Enter your email and password.' : 'New accounts join as team members.'}
              </p>
            </div>
            {!isLogin && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" className="input" value={form.name} onChange={set('name')} required />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" value={form.password} onChange={set('password')} required minLength={isLogin ? undefined : 6} />
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="font-medium text-indigo-600 hover:underline"
              onClick={() => {
                setMode(isLogin ? 'register' : 'login')
                setError('')
              }}
            >
              {isLogin ? 'Register' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  )
}
