export type UserRole =
  | 'admin'
  | 'user'
  | 'agent'
  | 'valuer'
  | 'investor'
  | 'buyer'

export interface User {
  id: string
  email: string
  fullName: string
  roles: UserRole[]
  avatar: string | null
  createdAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  // Only sent once the backend has asked for a captcha (adaptive challenge).
  turnstileToken?: string
}

export interface RegisterCredentials {
  fullName: string
  email: string
  password: string
  role?: UserRole
  turnstileToken?: string
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
  roles: UserRole[]
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
  // Backend risk scoring asks for a captcha before the next attempt.
  captchaRequired?: boolean
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
  readonly captchaRequired: boolean

  constructor(message: string, errors?: Record<string, string>, captchaRequired = false) {
    super(message)
    this.name = 'AuthError'
    this.errors = errors
    this.captchaRequired = captchaRequired
  }
}
