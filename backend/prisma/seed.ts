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
  await prisma.comparableSale.createMany({
    data: [
      {
        addressLine: '12 Seaview Street',
        suburb: 'Richmond',
        state: 'VIC',
        postcode: '3121',
        propertyType: 'House',
        bedrooms: 3,
        bathrooms: 2,
        parking: 1,
        areaSqm: 420,
        soldPrice: 1250000,
        soldDate: new Date('2026-06-10'),
      },
      {
        addressLine: '44 Garden Avenue',
        suburb: 'Richmond',
        state: 'VIC',
        postcode: '3121',
        propertyType: 'House',
        bedrooms: 4,
        bathrooms: 2,
        parking: 2,
        areaSqm: 480,
        soldPrice: 1420000,
        soldDate: new Date('2026-07-02'),
      },
      {
        addressLine: '9 Church Street',
        suburb: 'Richmond',
        state: 'VIC',
        postcode: '3121',
        propertyType: 'Unit',
        bedrooms: 2,
        bathrooms: 1,
        parking: 1,
        areaSqm: 95,
        soldPrice: 620000,
        soldDate: new Date('2026-05-18'),
      },
    ],
  })

  await prisma.marketIntelligence.deleteMany()
  await prisma.marketIntelligence.create({
    data: {
      suburb: 'Richmond',
      state: 'VIC',
      medianPrice: 1280000,
      medianPriceGrowthPct: 8.2,
      monthlyGrowthPct: 0.68,
      monthlyGrowthTrendPp: 0.12,
      daysOnMarket: 22,
      daysOnMarketTrendDays: -3,
      rentalYieldPct: 3.4,
      rentalYieldTrendPct: 0.2,
      priceTrendJson: JSON.stringify([
        { month: 'Jan', priceIndex: 61 },
        { month: 'Feb', priceIndex: 65 },
        { month: 'Mar', priceIndex: 69 },
        { month: 'Apr', priceIndex: 73 },
        { month: 'May', priceIndex: 77 },
        { month: 'Jun', priceIndex: 81 },
        { month: 'Jul', priceIndex: 85 },
        { month: 'Aug', priceIndex: 89 },
        { month: 'Sep', priceIndex: 93 },
        { month: 'Oct', priceIndex: 97 },
        { month: 'Nov', priceIndex: 100 },
        { month: 'Dec', priceIndex: 103 },
      ]),
      asOfMonth: new Date('2026-08-01'),
    },
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
