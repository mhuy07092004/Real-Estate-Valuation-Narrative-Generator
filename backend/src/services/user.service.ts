import { prisma } from '../lib/prisma.js'
import type { StoredUser } from '../types/auth.types.js'

// Internal shape used by login flows that need hashed password access.
export type StoredUserWithPassword = StoredUser & {
  passwordHash: string | null
}

// Normalizes Prisma user+role records into a stable service-level shape.
function toStoredUserWithPassword(user: {
  userId: string
  fullName: string
  email: string
  phone: string | null
  company: string | null
  passwordHash: string | null
  createdAt: Date
  role: { roleName: string } | null
}): StoredUserWithPassword {
  return {
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    company: user.company,
    roleName: user.role?.roleName ?? null,
    createdAt: user.createdAt,
    passwordHash: user.passwordHash,
  }
}

/** Returns role id for registration default-role assignment. */
export async function findRoleIdByName(roleName: string): Promise<number | null> {
  const role = await prisma.role.findUnique({ where: { roleName } })
  return role?.roleId ?? null
}

/** Ensures a role exists and returns its id (used by registration fallback). */
export async function ensureRoleIdByName(roleName: string): Promise<number> {
  const role = await prisma.role.upsert({
    where: { roleName },
    update: {},
    create: { roleName },
  })

  return role.roleId
}

/** Finds user by email for login/duplicate-check paths. */
export async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  })

  if (!user) return null
  return toStoredUserWithPassword(user)
}

/** Finds user by id for /me and refresh-token flows. */
export async function findUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: { role: true },
  })

  if (!user) return null
  return toStoredUserWithPassword(user)
}

/** Updates the editable fields on Settings > Personal Information. */
export async function updateUserProfile(
  userId: string,
  params: { fullName: string; phone: string | null; company: string | null },
): Promise<StoredUser | null> {
  const user = await prisma.user.update({
    where: { userId },
    data: {
      fullName: params.fullName,
      phone: params.phone,
      company: params.company,
    },
    include: { role: true },
  })

  return toStoredUserWithPassword(user)
}

// roleId is nullable/optional on both branches — every new account (local
// OTP sign-up or first-time Google sign-in) is created role-less, and
// ProtectedRoute redirects any role-less user to /select-role (see
// registration.service.ts, google-auth.service.ts, and selectUserRole in
// auth.service.ts).
type CreateUserParams =
  | {
      fullName: string
      email: string
      roleId?: number | null
      authProvider: 'local'
      passwordHash: string
    }
  | {
      fullName: string
      email: string
      roleId?: number | null
      authProvider: 'google'
      passwordHash?: undefined
    }

/**
 * Persists a new user and returns frontend-safe profile fields. `authProvider`
 * and `passwordHash` are tied together by this discriminated union, not two
 * independent optional fields — 'local' requires a passwordHash, an OAuth
 * provider forbids one (schema.prisma's User.passwordHash is nullable
 * specifically for OAuth-only accounts). This makes "local account with no
 * password" a compile error instead of a silent possibility: every call
 * site must say which case it is.
 */
export async function createUser(params: CreateUserParams): Promise<StoredUser> {
  const user = await prisma.user.create({
    data: {
      fullName: params.fullName,
      email: params.email,
      passwordHash: params.authProvider === 'local' ? params.passwordHash : null,
      roleId: params.roleId ?? null,
      authProvider: params.authProvider,
    },
    include: { role: true },
  })

  // Deliberately not toStoredUserWithPassword(user) — the one other caller
  // (findUserByEmail/findUserById) needs the hash for login comparison, but
  // createUser's result goes straight into the registration response path,
  // so it must never carry passwordHash even internally.
  const { passwordHash: _passwordHash, ...stored } = toStoredUserWithPassword(user)
  return stored
}

// Only writes if the role is still unset (roleId: null is part of the WHERE,
// not just a precondition checked earlier) — closes the race where two
// concurrent requests both read "unset" and the second silently overwrites
// the first's role. Returns null when the guard didn't match, so the caller
// can tell "already set" apart from "user not found".
export async function updateUserRole(userId: string, roleId: number): Promise<StoredUser | null> {
  const { count } = await prisma.user.updateMany({
    where: { userId, roleId: null },
    data: { roleId },
  })

  if (count === 0) return null
  return findUserById(userId)
}
