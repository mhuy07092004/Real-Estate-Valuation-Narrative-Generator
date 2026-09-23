import { z } from 'zod'

// Input contracts for auth endpoints.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  // Only sent once risk scoring has asked for a captcha (see auth-risk.service).
  turnstileToken: z.string().min(1).optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

// `credential` is the ID token Google Identity Services hands back to the
// frontend. `role` is only required the first time this email signs in —
// see loginOrRegisterWithGoogle in google-auth.service.ts.
export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Missing Google credential'),
  role: z.enum(['agent', 'valuer', 'investor', 'buyer']).optional(),
})

// `credential` is the ID token MSAL hands back to the frontend. `role` is
// only required the first time this email signs in — see
// loginOrRegisterWithMicrosoft in microsoft-auth.service.ts.
export const microsoftAuthSchema = z.object({
  credential: z.string().min(1, 'Missing Microsoft credential'),
  role: z.enum(['agent', 'valuer', 'investor', 'buyer']).optional(),
})

// Empty string means "clear this field" — normalized to null before hitting
// the DB (see updateUserProfile), since these columns are nullable, not
// required, unlike fullName.
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  phone: z.string().trim().max(30, 'Phone number is too long').optional(),
  company: z.string().trim().max(120, 'Company name is too long').optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
