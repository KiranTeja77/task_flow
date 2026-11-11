import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth'
import Layout from './components/Layout'
import Board from './pages/Board'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Tasks from './pages/Tasks'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="board" element={<Board />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
