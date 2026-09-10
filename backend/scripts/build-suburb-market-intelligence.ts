// One-off: computes real per-suburb MarketIntelligence rows from the
// ComparableSale data already in the DB (see ingest-bronze-listings.ts).
// Only populates what's honestly derivable from bulk sold-listing data —
// median price, price growth, and a real 12-month price trend. Leaves
// daysOnMarket/rentalYieldPct null (genuinely unknown: the source data has
// no original listing date to measure time-on-market from, and no rental
// data at all) rather than fabricating a plausible-looking number.
//
// Skips any suburb with fewer than MIN_SALES_IN_WINDOW sales in the
// trailing 12 months — below that, a "trend" is mostly noise, not signal.
// Never touches existing rows outside this script's own suburb+state set
// (Richmond VIC's seeded row is untouched — it's keyed by state, and this
// script only processes suburbs that actually have ComparableSale rows).
//
// Usage: npx tsx scripts/build-suburb-market-intelligence.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const MIN_SALES_IN_WINDOW = 8

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function monthKey(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// BACKEND-118: broad House-vs-Unit split for the values ingest-bronze-listings.ts's
// normalizePropertyType() already produced (House/Townhouse/Villa/Apartment/Unit).
function houseOrUnitCategory(propertyType: string): 'House' | 'Unit' | null {
    if (propertyType === 'House' || propertyType === 'Townhouse' || propertyType === 'Villa') return 'House'
    if (propertyType === 'Apartment' || propertyType === 'Unit') return 'Unit'
    return null
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

async function main() {
    const sales = await prisma.comparableSale.findMany({
        include: { property: { select: { suburb: true, state: true, propertyType: true } } },
    })

    if (sales.length === 0) {
        console.log('No comparable sales found — nothing to aggregate.')
        return
    }

    const referenceDate = sales.reduce((max, s) => (s.soldDate > max ? s.soldDate : max), sales[0].soldDate)
    // 12-month window ending at the reference month (inclusive).
    const windowStart = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - 11, 1))

    const bySuburb = new Map<string, { suburb: string; state: string; sales: { price: number; date: Date; propertyType: string }[] }>()
    for (const sale of sales) {
        const key = `${sale.property.suburb}|${sale.property.state}`
        if (!bySuburb.has(key)) {
            bySuburb.set(key, { suburb: sale.property.suburb, state: sale.property.state, sales: [] })
        }
        bySuburb.get(key)!.sales.push({ price: sale.soldPrice, date: sale.soldDate, propertyType: sale.property.propertyType })
    }

    let created = 0
    let skipped = 0

    for (const { suburb, state, sales: suburbSales } of bySuburb.values()) {
        const inWindow = suburbSales.filter((s) => s.date >= windowStart)
        if (inWindow.length < MIN_SALES_IN_WINDOW) {
            skipped++
            continue
        }

        // Group prices by month within the window.
        const byMonth = new Map<string, number[]>()
        for (const s of inWindow) {
            const key = monthKey(s.date)
            if (!byMonth.has(key)) byMonth.set(key, [])
            byMonth.get(key)!.push(s.price)
        }

        // Build the 12 calendar months in order, forward-filling months
        // with no sales from the nearest earlier month (back-filling the
        // very first month from the nearest later one if needed) — an
        // honest "price held at last known level" proxy, not a guess.
        const months: { key: string; label: string; medianPrice: number | null }[] = []
        for (let i = 0; i < 12; i++) {
            const d = new Date(Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth() + i, 1))
            const key = monthKey(d)
            const prices = byMonth.get(key)
            months.push({ key, label: MONTH_LABELS[d.getUTCMonth()], medianPrice: prices ? median(prices) : null })
        }

        for (let i = 1; i < months.length; i++) {
            if (months[i].medianPrice === null) months[i].medianPrice = months[i - 1].medianPrice
        }
        for (let i = months.length - 2; i >= 0; i--) {
            if (months[i].medianPrice === null) months[i].medianPrice = months[i + 1].medianPrice
        }

        const baseline = months[0].medianPrice!
        const priceTrend = months.map((m) => ({
            month: m.label,
            priceIndex: Math.round((m.medianPrice! / baseline) * 100),
        }))

        const lastIndex = priceTrend[priceTrend.length - 1].priceIndex
        const prevIndex = priceTrend[priceTrend.length - 2].priceIndex
        const prevPrevIndex = priceTrend[priceTrend.length - 3].priceIndex

        const medianPriceGrowthPct = lastIndex - 100
        const monthlyGrowthPct = prevIndex > 0 ? ((lastIndex - prevIndex) / prevIndex) * 100 : 0
        const previousMonthlyGrowthPct = prevPrevIndex > 0 ? ((prevIndex - prevPrevIndex) / prevPrevIndex) * 100 : 0
        const monthlyGrowthTrendPp = monthlyGrowthPct - previousMonthlyGrowthPct

        // BACKEND-118: House-vs-Unit median split, same trailing 12-month
        // window — null (not zero, not a copy of the blended median) when a
        // suburb had zero sales of that category.
        const housePrices = inWindow.filter((s) => houseOrUnitCategory(s.propertyType) === 'House').map((s) => s.price)
        const unitPrices = inWindow.filter((s) => houseOrUnitCategory(s.propertyType) === 'Unit').map((s) => s.price)
        const medianHousePrice = housePrices.length > 0 ? median(housePrices) : null
        const medianUnitPrice = unitPrices.length > 0 ? median(unitPrices) : null

        await prisma.marketIntelligence.upsert({
            where: { suburb_state: { suburb, state } },
            update: {
                medianPrice: median(inWindow.map((s) => s.price)),
                medianPriceGrowthPct,
                monthlyGrowthPct,
                monthlyGrowthTrendPp,
                // daysOnMarket/rentalYieldPct deliberately omitted from update (unlike
                // create, below) — load-external-market-data.ts (BACKEND-117) may have
                // already written real values here; this script re-running must not
                // clobber them back to null.
                medianHousePrice,
                medianUnitPrice,
                priceTrendJson: JSON.stringify(priceTrend),
                asOfMonth: referenceDate,
            },
            create: {
                suburb,
                state,
                medianPrice: median(inWindow.map((s) => s.price)),
                medianPriceGrowthPct,
                monthlyGrowthPct,
                monthlyGrowthTrendPp,
                daysOnMarket: null,
                daysOnMarketTrendDays: null,
                rentalYieldPct: null,
                rentalYieldTrendPct: null,
                medianHousePrice,
                medianUnitPrice,
                priceTrendJson: JSON.stringify(priceTrend),
                asOfMonth: referenceDate,
            },
        })
        created++
    }

    console.log(`Suburbs with a real MarketIntelligence row: ${created}`)
    console.log(`Suburbs skipped (fewer than ${MIN_SALES_IN_WINDOW} sales in trailing 12 months): ${skipped}`)
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
