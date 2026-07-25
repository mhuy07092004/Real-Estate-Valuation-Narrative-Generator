// Mirrors frontend/src/types/auth.ts — kept in sync manually for now since
// frontend and backend are separate npm projects with no shared package yet.

export type StoredUser = {
  userId: string
  fullName: string
  email: string
  roleName: string
  createdAt: Date
}

// NOTE: the frontend's `User.roles` is a string ARRAY (multi-role), but our
// schema (matching the team's ERD) gives each user a single `role_id`. This
// maps that one role into a one-element array so the frontend's
// `roles.includes(role)` checks still work today. If the product actually
// needs multi-role users, that's a schema conversation with whoever owns
// the users/roles tables — this mapper is a stopgap, not a real fix.
export type FrontendUser = {
  id: string
  email: string
  fullName: string
  roles: string[]
  avatar: string | null
  createdAt: string
}

export function toFrontendUser(user: StoredUser): FrontendUser {
  return {
    id: user.userId,
    email: user.email,
    fullName: user.fullName,
    roles: [user.roleName],
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
