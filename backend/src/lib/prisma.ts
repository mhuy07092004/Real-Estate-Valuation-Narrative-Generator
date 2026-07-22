import { PrismaClient } from '@prisma/client'

// tsx watch re-runs this module on every file change; without a
// singleton you'd open a fresh SQLite connection each reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
