import { useCallback, useEffect, useState } from 'react'
import api from './api'
import { errorMessage } from './lib'
import { useAuth } from './auth'
import { useToast } from './toast'

/** Loads tasks + users and exposes helpers for status changes. Shared by Tasks and Board pages. */
export function useTasks() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      const [t, u] = await Promise.all([api.get('/tasks'), api.get('/users')])
      setTasks(t.data)
      setUsers(u.data)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const canChangeStatus = (task) => isAdmin || task.assigneeId === user.id

  async function changeStatus(task, status) {
    if (status === task.status) return
    const previous = tasks
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      await api.patch(`/tasks/${task.id}/status`, { status })
      toast.success('Status updated')
    } catch (err) {
      setTasks(previous)
      toast.error(errorMessage(err, 'Could not update status'))
    }
  }

  return { tasks, users, loading, failed, load, canChangeStatus, changeStatus }
}
