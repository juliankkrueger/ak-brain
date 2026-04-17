import { create } from 'zustand'
import { api } from '../api/client'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'sales' | 'consultant' | 'manager' | 'creative'
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  restore: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  restore: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr), isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  login: async (email, password) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    set({ token: data.token, user: data.user })
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },
}))

export const canEdit = (role: User['role']) =>
  role === 'admin' || role === 'consultant'

export const isAdmin = (role: User['role']) => role === 'admin'
