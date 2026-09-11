//**default import, not `import { PrismaClient } from '@prisma/client'*/
import PrismaPkg from '@prisma/client'

const { PrismaClient } = PrismaPkg

// tsx watch re-runs this module on every file change; without a singleton you'd open a fresh SQLite connection each reload*/
const globalForPrisma = globalThis as unknown as { prisma?: InstanceType<typeof PrismaClient> }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
