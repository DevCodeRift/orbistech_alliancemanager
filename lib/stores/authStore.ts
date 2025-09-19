'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  discordId: string
  discordUsername: string
  discordAvatar?: string
  pnwNationName?: string
  isSystemAdmin?: boolean
  allianceManagers?: Array<{
    id: string
    allianceId: string
    allianceName: string
    allianceSlug: string
    role: string
    permissions: any
    isActive: boolean
  }>
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setToken: (token) =>
        set({ token, isAuthenticated: !!token }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })

        localStorage.removeItem('auth-storage')

        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },

      initialize: async () => {
        const { token } = get()

        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const userData = await response.json()
            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false
            })
          } else {
            get().logout()
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          get().logout()
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user
      }),
    }
  )
)