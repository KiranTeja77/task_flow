import axios from 'axios'

const STORAGE_KEY = 'taskflow.auth'

export function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
  } catch {
    return null
  }
}

export function saveAuth(auth) {
  if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  else localStorage.removeItem(STORAGE_KEY)
}

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const auth = loadAuth()
  if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      saveAuth(null)
      window.location.assign('/login')
    }
    return Promise.reject(err)
  },
)

export default api
