import { prisma } from '../lib/prisma.js'
import type { StoredUser } from '../types/auth.types.js'

export async function findRoleIdByName(roleName: string): Promise<number | null> {
  const role = await prisma.role.findUnique({ where: { roleName } })
  return role?.roleId ?? null
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email }, include: { role: true } })
}

export async function createUser(params: {
  fullName: string
  email: string
  passwordHash: string
  roleId: number
}): Promise<StoredUser> {
  const user = await prisma.user.create({
    data: {
      fullName: params.fullName,
      email: params.email,
      passwordHash: params.passwordHash,
      roleId: params.roleId,
      authProvider: 'local',
    },
    include: { role: true },
  })

  return {
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    roleName: user.role.roleName,
    createdAt: user.createdAt,
  }
}
