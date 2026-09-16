import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSession, LoginCredentials, RegisterCredentials, User } from '../../../types/auth'
import {
  clearSession,
  getStoredSession,
  login as loginRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest,
  type UpdateProfileInput,
} from '../../../services/auth'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  register: (credentials: RegisterCredentials) => Promise<AuthSession>
  updateProfile: (input: UpdateProfileInput) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getStoredSession()
    setUser(session?.user ?? null)
    setIsLoading(false)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await loginRequest(credentials)
    setUser(session.user)
    return session
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const session = await registerRequest(credentials)
    setUser(session.user)
    return session
  }, [])
  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const updatedUser = await updateProfileRequest(input)
    setUser(updatedUser)
    return updatedUser
  }, [])

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
      updateProfile,
      logout,
    }),
    [user, isLoading, login, register, updateProfile, logout]
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
