// Exports real, backend-grounded inputs for the SCP-425 fine-tuning
// distillation dataset (see .claude/plans and data_ai/docs/scp425_plan.md).
//
// Reuses the same real data + logic report-content.service.ts uses when it
// builds a report today, so the training inputs match production evidence,
// not a separate/simplified data source:
//   - comparable sales, ranked the same way findComparablesInSuburb does
//     (comparable-sale.service.ts) — reimplemented locally against a single
//     up-front fetch of the whole table (33k+ rows) instead of calling that
//     service per candidate, since this script evaluates hundreds of
//     candidates and the service's per-call full-table fetch+join, fine for
//     the live app's one-request-at-a-time usage, made a batch run this
//     size take many minutes
//   - raw MarketIntelligence row (same table market-intelligence.service.ts
//     reads, queried directly here for full-precision numbers instead of
//     that service's pre-formatted display strings)
//   - calculateRoi / calculateAffordability (the real investor/buyer
//     calculator formulas), run with varied-but-plausible financial inputs
//     since a subject property has no saved ROI/affordability inputs of its
//     own yet — only real reports have those persisted
//
// Distributes ~300 examples evenly across the 4 real roles (not the old
// SCP-425 doc's buyer_purpose scheme — see the plan for why). Deterministic
// via a seeded PRNG so re-running reproduces the same sample.
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../src/lib/prisma.js'
import { getMarketComparisonSuburbs } from '../src/services/market-comparison.service.js'
import { calculateRoi, type RoiCalculationInput } from '../src/services/roi-calculation.service.js'
import {
    calculateAffordability,
    type AffordabilityCalculationInput,
} from '../src/services/affordability-calculation.service.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', '..', 'data_ai', 'docs', 'fixtures', 'narrative_dataset_inputs.jsonl')

const ROLES = ['agent', 'valuer', 'buyer', 'investor'] as const
type Role = (typeof ROLES)[number]

const REPORT_TYPE_BY_ROLE: Record<Role, string> = {
    agent: 'vendor-appraisal',
    valuer: 'bank-valuation',
    buyer: 'buyer-report',
    investor: 'investment-report',
}

const TARGET_PER_ROLE = 75
const MAX_COMPARABLES = 5

// Deterministic PRNG (mulberry32) so re-running produces the same sample —
// same reproducibility goal as split_narrative_dataset.py's fixed seed 42.
function mulberry32(seed: number) {
    let state = seed
    return () => {
        state |= 0
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function randInt(rng: () => number, min: number, max: number): number {
    return Math.floor(rng() * (max - min + 1)) + min
}

function randFloat(rng: () => number, min: number, max: number): number {
    return min + rng() * (max - min)
}

function shuffle<T>(items: T[], rng: () => number): T[] {
    const arr = items.slice()
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

type SaleRow = {
    propertyId: string
    soldPrice: number
    soldDate: Date
    property: {
        addressLine: string
        suburb: string
        propertyType: string
        bedrooms: number
        bathrooms: number
        parking: number
        areaSqm: number
    }
}

type SubjectLike = {
    propertyId: string
    addressLine: string
    suburb: string
    propertyType: string
    bedrooms: number
    bathrooms: number
    parking: number
}

// Same similarity scoring as comparable-sale.service.ts's similarityScore —
// kept in lockstep with that function; if it changes, update here too.
function similarityScore(row: SaleRow, subject: SubjectLike): number {
    let score = 0
    if (row.property.propertyType.toLowerCase() === subject.propertyType.toLowerCase()) score += 3
    score -= Math.abs(row.property.bedrooms - subject.bedrooms)
    score -= Math.abs(row.property.bathrooms - subject.bathrooms)
    score -= Math.abs(row.property.parking - subject.parking)
    return score
}

// Excludes the subject's own past sale from its own comparables list — the
// real findComparablesInSuburb doesn't do this (it has no way to know a
// "subject" is itself a stored Property), so a subject that also has a
// comparable_sales row shows up as its own top comp there too. Worth fixing
// here regardless: training the model to cite a property's own historical
// sale as if it were independent evidence is actively wrong, not just an
// edge case to ignore.
//
// Also excludes by address (case-insensitive), not just propertyId — the
// backend DB has duplicate Property rows sharing the same address (a
// pre-existing data-quality artifact from the earlier bulk import), so
// propertyId alone doesn't catch every self-match.
function rankComparables(salesBySuburb: Map<string, SaleRow[]>, subject: SubjectLike, max: number): SaleRow[] {
    const sameSuburb = salesBySuburb.get(subject.suburb.trim().toLowerCase()) ?? []
    const subjectAddress = subject.addressLine.trim().toLowerCase()
    return sameSuburb
        .filter((row) => row.propertyId !== subject.propertyId)
        .filter((row) => row.property.addressLine.trim().toLowerCase() !== subjectAddress)
        .slice()
        .sort((a, b) => similarityScore(b, subject) - similarityScore(a, subject))
        .slice(0, max)
}

async function main() {
    const suburbs = await getMarketComparisonSuburbs()
    if (suburbs.length === 0) {
        throw new Error('No suburbs with complete MarketIntelligence data found — run load-external-market-data.ts first.')
    }
    console.log(`${suburbs.length} qualifying suburbs found.`)

    const rng = mulberry32(42)
    const suburbNames = suburbs.map((s) => s.suburb)

    // One query for every candidate property across all qualifying suburbs,
    // instead of one findMany per suburb.
    const pool = await prisma.property.findMany({
        where: { suburb: { in: suburbNames } },
        select: { propertyId: true },
    })
    if (pool.length === 0) {
        throw new Error('Qualifying suburbs exist but contain no properties — unexpected given how they were populated.')
    }
    console.log(`${pool.length} candidate properties across those suburbs.`)

    // One fetch of the whole comparable_sales table (33k+ rows), indexed by
    // suburb — replaces hundreds of repeated full-table fetches that
    // findComparablesInSuburb would otherwise do if called per candidate.
    const allSales = await prisma.comparableSale.findMany({
        orderBy: { soldDate: 'desc' },
        include: { property: true },
    })
    const salesBySuburb = new Map<string, SaleRow[]>()
    for (const sale of allSales) {
        const key = sale.property.suburb.trim().toLowerCase()
        const list = salesBySuburb.get(key) ?? []
        list.push(sale)
        salesBySuburb.set(key, list)
    }
    console.log(`${allSales.length} comparable sales indexed across ${salesBySuburb.size} suburbs.`)

    // Also fetch all candidate properties + market rows up front, keyed by id
    // / suburb+state, instead of one findUnique/findFirst per candidate.
    const properties = await prisma.property.findMany({ where: { propertyId: { in: pool.map((p) => p.propertyId) } } })
    const propertyById = new Map(properties.map((p) => [p.propertyId, p]))

    const marketRows = await prisma.marketIntelligence.findMany({
        where: { suburb: { in: suburbNames } },
    })
    const marketBySuburbState = new Map(marketRows.map((m) => [`${m.suburb.trim().toLowerCase()}|${m.state.trim().toLowerCase()}`, m]))

    const shuffledPool = shuffle(pool, rng)

    const rows: Record<string, unknown>[] = []
    let poolCursor = 0

    for (const role of ROLES) {
        let collected = 0
        let attempts = 0
        while (collected < TARGET_PER_ROLE && attempts < shuffledPool.length * 2) {
            const candidate = shuffledPool[poolCursor % shuffledPool.length]
            poolCursor++
            attempts++

            const property = propertyById.get(candidate.propertyId)
            if (!property) continue

            const comparables = rankComparables(salesBySuburb, property, MAX_COMPARABLES)
            if (comparables.length === 0) continue

            const marketRow = marketBySuburbState.get(`${property.suburb.trim().toLowerCase()}|${property.state.trim().toLowerCase()}`)
            if (!marketRow) continue

            const prices = comparables.map((c) => c.soldPrice)
            const estimatedValue = prices.reduce((sum, p) => sum + p, 0) / prices.length

            let roi: ReturnType<typeof calculateRoi> | null = null
            let roiInputs: RoiCalculationInput | null = null
            let affordability: ReturnType<typeof calculateAffordability> | null = null
            let affordabilityInputs: AffordabilityCalculationInput | null = null

            if (role === 'investor') {
                const deposit = estimatedValue * randFloat(rng, 0.1, 0.3)
                // Anchor weekly rent to the suburb's real rental yield when known,
                // else a plausible generic assumption — never fully invented.
                const assumedYieldPct = marketRow.rentalYieldPct ?? randFloat(rng, 3.0, 4.5)
                const weeklyRent = (estimatedValue * (assumedYieldPct / 100)) / 52
                roiInputs = {
                    purchasePrice: Math.round(estimatedValue),
                    deposit: Math.round(deposit),
                    interestRate: Number(randFloat(rng, 5.5, 7.2).toFixed(2)),
                    loanTermYears: randInt(rng, 0, 1) === 0 ? 25 : 30,
                    weeklyRent: Math.round(weeklyRent),
                    vacancyAllowance: Number(randFloat(rng, 2, 5).toFixed(1)),
                    managementFee: Number(randFloat(rng, 5.5, 8.5).toFixed(1)),
                    councilRates: randInt(rng, 1800, 3200),
                    landlordInsurance: randInt(rng, 400, 900),
                    maintenance: randInt(rng, 800, 2200),
                    landTax: randInt(rng, 0, 1500),
                }
                roi = calculateRoi(roiInputs)
            }

            if (role === 'buyer') {
                const yourAnnualIncome = randInt(rng, 65_000, 145_000)
                const partnerAnnualIncome = randInt(rng, 0, 1) === 0 ? 0 : randInt(rng, 45_000, 110_000)
                affordabilityInputs = {
                    yourAnnualIncome,
                    partnerAnnualIncome,
                    availableDeposit: Math.round(estimatedValue * randFloat(rng, 0.08, 0.25)),
                    existingMonthlyDebt: randInt(rng, 0, 900),
                    monthlyLivingExpenses: randInt(rng, 1800, 4200),
                    councilRates: randInt(rng, 1800, 3200),
                    landlordInsurance: randInt(rng, 0, 600),
                }
                affordability = calculateAffordability(affordabilityInputs)
            }

            rows.push({
                pair_id: `${property.propertyId}-${role}`,
                property_id: property.propertyId,
                role,
                report_type: REPORT_TYPE_BY_ROLE[role],
                subject: {
                    address: property.addressLine,
                    suburb: property.suburb,
                    state: property.state,
                    postcode: property.postcode,
                    propertyType: property.propertyType,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    parking: property.parking,
                    areaSqm: property.areaSqm,
                },
                estimated_value: Math.round(estimatedValue),
                comparables: comparables.map((c) => ({
                    address: c.property.addressLine,
                    soldPrice: c.soldPrice,
                    soldDate: c.soldDate,
                    bedrooms: c.property.bedrooms,
                    bathrooms: c.property.bathrooms,
                    parking: c.property.parking,
                    areaSqm: c.property.areaSqm,
                })),
                market: {
                    medianPrice: marketRow.medianPrice,
                    medianPriceGrowthPct: marketRow.medianPriceGrowthPct,
                    monthlyGrowthPct: marketRow.monthlyGrowthPct,
                    daysOnMarket: marketRow.daysOnMarket,
                    rentalYieldPct: marketRow.rentalYieldPct,
                    auctionClearanceRatePct: marketRow.auctionClearanceRatePct,
                    vacancyRatePct: marketRow.vacancyRatePct,
                },
                roi: roi
                    ? {
                          inputs: roiInputs,
                          grossYieldPct: roi.grossYieldPct,
                          netYieldPct: roi.netYieldPct,
                          monthlyCashFlow: roi.monthlyCashFlow,
                          cashOnCashReturnPct: roi.cashOnCashReturnPct,
                      }
                    : null,
                affordability: affordability
                    ? {
                          inputs: affordabilityInputs,
                          estimatedBorrowingCapacity: affordability.estimatedBorrowingCapacity,
                          maxLoanAmount: affordability.maxLoanAmount,
                          repaymentToIncomePct: affordability.repaymentToIncomePct,
                      }
                    : null,
            })
            collected++
        }

        if (collected < TARGET_PER_ROLE) {
            console.warn(`Only collected ${collected}/${TARGET_PER_ROLE} examples for role "${role}" (pool exhausted).`)
        } else {
            console.log(`Collected ${collected} examples for role "${role}".`)
        }
    }

    mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
    writeFileSync(OUTPUT_PATH, rows.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf-8')
    console.log(`Wrote ${rows.length} rows to ${OUTPUT_PATH}`)
}

main()
    .catch((err) => {
        console.error(err)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
