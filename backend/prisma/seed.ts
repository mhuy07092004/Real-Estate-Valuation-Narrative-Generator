import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const userRole = await prisma.role.upsert({
    where: { roleName: 'user' },
    update: {},
    create: { roleName: 'user' },
  })

  await prisma.role.upsert({
    where: { roleName: 'admin' },
    update: {},
    create: { roleName: 'admin' },
  })

  const passwordHash = await bcrypt.hash('Password123', 10)

  await prisma.user.upsert({
    where: { email: 'postman.user@example.com' },
    update: {
      fullName: 'Postman User',
      passwordHash,
      roleId: userRole.roleId,
      authProvider: 'local',
      isActive: true,
    },
    create: {
      fullName: 'Postman User',
      email: 'postman.user@example.com',
      passwordHash,
      roleId: userRole.roleId,
      authProvider: 'local',
      isActive: true,
    },
  })

  await prisma.comparableSale.deleteMany()
  await prisma.marketIntelligence.deleteMany()

  await prisma.comparableSale.createMany({
    data: [
      {
        addressLine: '12 Seaview Street',
        suburb: 'Bondi',
        state: 'NSW',
        postcode: '2026',
        propertyType: 'house',
        bedrooms: 3,
        bathrooms: 2,
        parking: 1,
        landSizeSqm: 380,
        soldPrice: 1850000,
        soldDate: new Date('2026-05-10'),
        dataSource: 'seed',
      },
      {
        addressLine: '44 Garden Avenue',
        suburb: 'Parramatta',
        state: 'NSW',
        postcode: '2150',
        propertyType: 'unit',
        bedrooms: 2,
        bathrooms: 1,
        parking: 1,
        landSizeSqm: 120,
        soldPrice: 760000,
        soldDate: new Date('2026-06-02'),
        dataSource: 'seed',
      },
    ],
  })

  await prisma.marketIntelligence.createMany({
    data: [
      {
        suburb: 'Bondi',
        state: 'NSW',
        meanHousePrice: 2100000,
        monthGrowthPct: 1.4,
        rentalYieldPct: 2.8,
        buyerInterestLevel: 'high',
        supplyLevel: 'medium',
        priceGrowthLevel: 'high',
        asOfMonth: new Date('2026-07-01'),
      },
      {
        suburb: 'Parramatta',
        state: 'NSW',
        meanHousePrice: 1120000,
        monthGrowthPct: 0.7,
        rentalYieldPct: 3.9,
        buyerInterestLevel: 'medium',
        supplyLevel: 'medium',
        priceGrowthLevel: 'medium',
        asOfMonth: new Date('2026-07-01'),
      },
    ],
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
