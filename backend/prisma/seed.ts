import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.role.upsert({
    where: { roleName: 'user' },
    update: {},
    create: { roleName: 'user' },
  })
  await prisma.role.upsert({
    where: { roleName: 'admin' },
    update: {},
    create: { roleName: 'admin' },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })
