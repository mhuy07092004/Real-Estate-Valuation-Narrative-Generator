// Mirrors frontend/src/types/auth.ts — kept in sync manually for now since
// frontend and backend are separate npm projects with no shared package yet.

export type StoredUser = {
  userId: string
  fullName: string
  email: string
  phone: string | null
  company: string | null
  roleName: string
  createdAt: Date
}

// NOTE: the frontend's dashboard experience expects role arrays. The DB stores
// a single role_id, so this mapper expands the `admin` role into every
// dashboard role view (used for QA/demo accounts that need to see
// everything, e.g. the seeded demo account) while keeping a stable response
// contract. Every other role maps to exactly itself — one role, one
// dashboard, enforced both here and by requireRole on the backend routes.
export type FrontendUser = {
  id: string
  email: string
  fullName: string
  phone: string | null
  company: string | null
  roles: string[]
  avatar: string | null
  createdAt: string
}

export function toFrontendUser(user: StoredUser): FrontendUser {
  const expandedRoles =
    user.roleName === 'admin' ? ['admin', 'agent', 'valuer', 'investor', 'buyer'] : [user.roleName]

  return {
    id: user.userId,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    company: user.company,
    roles: expandedRoles,
    avatar: null,
    createdAt: user.createdAt.toISOString(),
  }
}

export type AuthResponseData = {
  user: FrontendUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type ApiSuccessResponse<T> = { success: true; message?: string; data: T }
// `captchaRequired` tells the client to reveal the captcha before the next
// attempt, so the widget only appears once risk scoring asks for it.
export type ApiErrorResponse = {
  success: false
  message: string
  errors?: Record<string, string>
  captchaRequired?: boolean
}
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export class DuplicateEmailError extends Error {
  readonly captchaRequired: boolean

  constructor(email: string, captchaRequired = false) {
    super(`An account with email "${email}" already exists`)
    this.name = 'DuplicateEmailError'
    this.captchaRequired = captchaRequired
  }
}

export class InvalidCredentialsError extends Error {
  readonly captchaRequired: boolean

  constructor(captchaRequired = false) {
    super('Invalid email or password.')
    this.name = 'InvalidCredentialsError'
    this.captchaRequired = captchaRequired
  }
}
