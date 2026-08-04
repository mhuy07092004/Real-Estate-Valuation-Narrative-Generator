// Mirrors frontend/src/types/auth.ts — kept in sync manually for now since
// frontend and backend are separate npm projects with no shared package yet.

export type StoredUser = {
  userId: string
  fullName: string
  email: string
  roleName: string
  createdAt: Date
}

// NOTE: the frontend's dashboard experience expects role arrays. The DB stores
// a single role_id, so this mapper expands core roles for prototype access
// (e.g. `user` can enter all dashboard role views) while keeping a stable
// response contract. Replace with product-approved role policy later.
export type FrontendUser = {
  id: string
  email: string
  fullName: string
  roles: string[]
  avatar: string | null
  createdAt: string
}

export function toFrontendUser(user: StoredUser): FrontendUser {
  const expandedRoles =
    user.roleName === 'admin'
      ? ['admin', 'agent', 'valuer', 'investor', 'buyer']
      : user.roleName === 'user'
        ? ['agent', 'valuer', 'investor', 'buyer']
        : [user.roleName]

  return {
    id: user.userId,
    email: user.email,
    fullName: user.fullName,
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
export type ApiErrorResponse = { success: false; message: string; errors?: Record<string, string> }
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`An account with email "${email}" already exists`)
    this.name = 'DuplicateEmailError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.')
    this.name = 'InvalidCredentialsError'
  }
}
