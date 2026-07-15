export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatar: string | null
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthTokenPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

export interface ApiSuccessResponse<T> {
  success: true
  message?: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors?: Record<string, string>
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface LoginResponseData {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export class AuthError extends Error {
  readonly errors?: Record<string, string>

  constructor(message: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'AuthError'
    this.errors = errors
  }
}
