import { http, HttpResponse, delay } from 'msw'
import type {
  AuthTokenPayload,
  LoginCredentials,
  User,
} from '../../../types/auth'

interface RegisterRequestBody {
  email: string
  password: string
  fullName: string
}

interface ForgotPasswordRequestBody {
  email: string
}

interface MockUser extends User {
  password: string
}

// ─── Mock Database ───────────────────────────────────────────────────────────

const MOCK_USERS: MockUser[] = [
  {
    id: 'usr_001',
    email: 'admin@relaive.com',
    fullName: 'Admin User',
    password: 'admin',
    role: 'admin',
    avatar: null,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
]

const registeredUsers: MockUser[] = [...MOCK_USERS]
const activeTokens = new Set<string>()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateMockToken(user: MockUser): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + 60 * 60 * 1000,
  }
  const token = btoa(JSON.stringify(payload))
  activeTokens.add(token)
  return token
}

function generateRefreshToken(): string {
  return btoa(`refresh_${Date.now()}_${Math.random().toString(36).slice(2)}`)
}

function sanitizeUser(user: MockUser): User {
  const { password: _password, ...safeUser } = user
  return safeUser
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

function decodeToken(token: string): AuthTokenPayload | null {
  try {
    const payload = JSON.parse(atob(token)) as AuthTokenPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

async function simulateLatency() {
  await delay(300 + Math.random() * 200)
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export const authHandlers = [
  http.post<never, LoginCredentials>('/api/auth/login', async ({ request }) => {
    await simulateLatency()

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Email and password are required.',
          errors: {
            ...(!email ? { email: 'Email is required' } : {}),
            ...(!password ? { password: 'Password is required' } : {}),
          },
        },
        { status: 400 }
      )
    }

    const user = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (!user || user.password !== password) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Invalid email or password.',
        },
        { status: 401 }
      )
    }

    const accessToken = generateMockToken(user)
    const refreshToken = generateRefreshToken()

    return HttpResponse.json(
      {
        success: true,
        message: 'Login successful.',
        data: {
          user: sanitizeUser(user),
          accessToken,
          refreshToken,
          expiresIn: 3600,
        },
      },
      { status: 200 }
    )
  }),

  http.post<never, RegisterRequestBody>(
    '/api/auth/register',
    async ({ request }) => {
      await simulateLatency()

      const body = await request.json()
      const { email, password, fullName } = body

      const errors: Record<string, string> = {}
      if (!email) errors.email = 'Email is required'
      if (!password) errors.password = 'Password is required'
      if (!fullName) errors.fullName = 'Full name is required'

      if (Object.keys(errors).length > 0) {
        return HttpResponse.json(
          {
            success: false,
            message: 'Validation failed.',
            errors,
          },
          { status: 400 }
        )
      }

      const existingUser = registeredUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      )

      if (existingUser) {
        return HttpResponse.json(
          {
            success: false,
            message: 'An account with this email already exists.',
            errors: { email: 'Email already in use' },
          },
          { status: 409 }
        )
      }

      if (password.length < 6) {
        return HttpResponse.json(
          {
            success: false,
            message: 'Password must be at least 6 characters.',
            errors: { password: 'Password too short' },
          },
          { status: 400 }
        )
      }

      const newUser: MockUser = {
        id: `usr_${String(registeredUsers.length + 1).padStart(3, '0')}`,
        email,
        fullName,
        password,
        role: 'user',
        avatar: null,
        createdAt: new Date().toISOString(),
      }

      registeredUsers.push(newUser)

      const accessToken = generateMockToken(newUser)
      const refreshToken = generateRefreshToken()

      return HttpResponse.json(
        {
          success: true,
          message: 'Account created successfully.',
          data: {
            user: sanitizeUser(newUser),
            accessToken,
            refreshToken,
            expiresIn: 3600,
          },
        },
        { status: 201 }
      )
    }
  ),

  http.post<never, ForgotPasswordRequestBody>(
    '/api/auth/forgot-password',
    async ({ request }) => {
      await simulateLatency()

      const body = await request.json()
      const { email } = body

      if (!email) {
        return HttpResponse.json(
          {
            success: false,
            message: 'Email is required.',
            errors: { email: 'Email is required' },
          },
          { status: 400 }
        )
      }

      return HttpResponse.json(
        {
          success: true,
          message:
            'If an account with that email exists, a password reset link has been sent.',
        },
        { status: 200 }
      )
    }
  ),

  http.get('/api/auth/me', async ({ request }) => {
    await simulateLatency()

    const authHeader = request.headers.get('Authorization')
    const token = extractBearerToken(authHeader)

    if (!token) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Authentication required. Please provide a valid token.',
        },
        { status: 401 }
      )
    }

    const payload = decodeToken(token)

    if (!payload || !activeTokens.has(token)) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Token is invalid or has expired.',
        },
        { status: 401 }
      )
    }

    const user = registeredUsers.find((u) => u.id === payload.userId)

    if (!user) {
      return HttpResponse.json(
        {
          success: false,
          message: 'User not found.',
        },
        { status: 404 }
      )
    }

    return HttpResponse.json(
      {
        success: true,
        data: { user: sanitizeUser(user) },
      },
      { status: 200 }
    )
  }),

  http.post('/api/auth/refresh-token', async ({ request }) => {
    await simulateLatency()

    const body = (await request.json()) as { refreshToken?: string }

    if (!body.refreshToken) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Refresh token is required.',
        },
        { status: 400 }
      )
    }

    try {
      const decoded = atob(body.refreshToken)
      if (!decoded.startsWith('refresh_')) {
        throw new Error('Invalid refresh token format')
      }
    } catch {
      return HttpResponse.json(
        {
          success: false,
          message: 'Invalid or expired refresh token.',
        },
        { status: 401 }
      )
    }

    const adminUser = registeredUsers[0]
    const newAccessToken = generateMockToken(adminUser)
    const newRefreshToken = generateRefreshToken()

    return HttpResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully.',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600,
        },
      },
      { status: 200 }
    )
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await simulateLatency()

    const authHeader = request.headers.get('Authorization')
    const token = extractBearerToken(authHeader)

    if (token) {
      activeTokens.delete(token)
    }

    return HttpResponse.json(
      {
        success: true,
        message: 'Logged out successfully.',
      },
      { status: 200 }
    )
  }),
]
