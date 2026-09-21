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

/** Persists a new local-auth user and returns frontend-safe profile fields. */
export async function createUser(params: {
  fullName: string
  email: string
  passwordHash: string
  roleId?: number | null
}): Promise<StoredUser> {
  const user = await prisma.user.create({
    data: {
      fullName: params.fullName,
      email: params.email,
      passwordHash: params.passwordHash,
      roleId: params.roleId ?? null,
      authProvider: 'local',
    },
    include: { role: true },
  })

  return toStoredUserWithPassword(user)
}

/** Assigns a dashboard role after sign-up (or any other role-null account). */
export async function updateUserRole(userId: string, roleId: number): Promise<StoredUser> {
  const user = await prisma.user.update({
    where: { userId },
    data: { roleId },
    include: { role: true },
  })

  return toStoredUserWithPassword(user)
}
