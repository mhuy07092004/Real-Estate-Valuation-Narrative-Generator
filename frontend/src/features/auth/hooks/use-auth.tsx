import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSession, LoginCredentials, User } from '../../../types/auth'
import {
  clearSession,
  getStoredSession,
  login as loginRequest,
  register as registerRequest,
} from '../../../services/auth'

// App-wide auth state wrapper around persisted session helpers.
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  register: (credentials: {
    fullName: string
    email: string
    password: string
  }) => Promise<AuthSession>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Hydrate auth state from localStorage once on app boot.
    const session = getStoredSession()
    setUser(session?.user ?? null)
    setIsLoading(false)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await loginRequest(credentials)
    setUser(session.user)
    return session
  }, [])

  const register = useCallback(
    async (credentials: { fullName: string; email: string; password: string }) => {
      const session = await registerRequest(credentials)
      setUser(session.user)
      return session
    },
    [],
  )

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
