// One-off: reads the four raw CSVs produced by data_ai/ingestion's Domain,
// ABS, and SQM production scripts, aggregates them per the decisions locked
// 2026-09-10 (see "Next task: load into Prisma..." in
// .agents/rules/backend-rebuild-plan.md), and UPDATES the matching existing
// MarketIntelligence rows (by suburb+state) with real values. Never creates
// a new suburb row from this data alone — a MarketIntelligence row's core
// fields (medianPrice, price trend) come from the bronze sales data via
// build-suburb-market-intelligence.ts, not from this.
//
// Decisions this script implements (do not change without re-confirming):
//   - Domain per-bedroom rows -> one suburb value: sales-weighted average
//     (weight = numberSold) across all (property category x bedroom count)
//     rows, for daysOnMarket / auctionClearanceRate / rentalYieldPct alike.
//   - ABS SA2 mapping: exact case-insensitive name match only
//     (sa2_name === suburb). No exact match -> skipped, left null.
//   - Supply constraint: dwelling approvals (most recent financial year)
//     per 1,000 residents (most recent year), using the same exact-match
//     SA2 for both — not a normalized score, just an honest ratio.
//   - Vacancy rate: the latest (year, month) row per postcode from the SQM
//     time series, vr converted from a decimal fraction to a percentage.
//
// Known input quirk this script must tolerate: domain_suburb_insights.csv
// may contain exact duplicate rows from being run more than once in append
// mode (a known, deliberately-unfixed issue — see the rebuild plan). This
// script dedupes by (suburb, state, property_category, bedrooms) before
// aggregating, keeping the last occurrence, so duplicates don't skew the
// weighted average.
//
// Usage: npx tsx scripts/load-external-market-data.ts
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const prisma = new PrismaClient()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_AI_DIR = join(__dirname, '..', '..', 'data_ai')
const DOMAIN_CSV_PATH = join(DATA_AI_DIR, 'domain_suburb_insights.csv')
const ABS_POPULATION_CSV_PATH = join(DATA_AI_DIR, 'abs_population_raw.csv')
const ABS_BUILDING_APPROVALS_CSV_PATH = join(DATA_AI_DIR, 'abs_building_approvals_raw.csv')
const SQM_VACANCY_CSV_PATH = join(DATA_AI_DIR, 'sqm_vacancy_rate_raw.csv')

function parseCsv(path: string): Record<string, string>[] {
    const raw = readFileSync(path, 'utf-8').trim()
    const lines = raw.split(/\r?\n/)
    const headers = lines[0].split(',')
    return lines.slice(1).map((line) => {
        const values = line.split(',')
        const row: Record<string, string> = {}
        headers.forEach((h, i) => {
            row[h] = values[i] ?? ''
        })
        return row
    })
}

function toNumberOrNull(value: string | undefined): number | null {
    if (value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

type DomainRow = {
    suburb: string
    state: string
    propertyCategory: string
    bedrooms: string
    medianSoldPrice: number | null
    daysOnMarket: number | null
    auctionClearanceRate: number | null
    numberSold: number | null
    rentalYieldPct: number | null
}

function loadDomainAggregates(): Map<string, { daysOnMarket: number | null; auctionClearanceRatePct: number | null; rentalYieldPct: number | null }> {
    const rawRows = parseCsv(DOMAIN_CSV_PATH)

    // Dedupe: keep the last occurrence per (suburb, state, category, bedrooms) —
    // tolerates the known append-mode duplication issue.
    const deduped = new Map<string, DomainRow>()
    for (const r of rawRows) {
        const key = `${r.suburb}|${r.state}|${r.property_category}|${r.bedrooms}`
        deduped.set(key, {
            suburb: r.suburb,
            state: r.state,
            propertyCategory: r.property_category,
            bedrooms: r.bedrooms,
            medianSoldPrice: toNumberOrNull(r.median_sold_price),
            daysOnMarket: toNumberOrNull(r.days_on_market),
            auctionClearanceRate: toNumberOrNull(r.auction_clearance_rate),
            numberSold: toNumberOrNull(r.number_sold),
            rentalYieldPct: toNumberOrNull(r.rental_yield_pct),
        })
    }

    const bySuburb = new Map<string, DomainRow[]>()
    for (const row of deduped.values()) {
        const key = `${row.suburb}|${row.state}`
        if (!bySuburb.has(key)) bySuburb.set(key, [])
        bySuburb.get(key)!.push(row)
    }

    function weightedAverage(rows: DomainRow[], pick: (r: DomainRow) => number | null): number | null {
        let weightedSum = 0
        let totalWeight = 0
        for (const row of rows) {
            const value = pick(row)
            const weight = row.numberSold ?? 0
            if (value === null || weight <= 0) continue
            weightedSum += value * weight
            totalWeight += weight
        }
        return totalWeight > 0 ? weightedSum / totalWeight : null
    }

    const result = new Map<string, { daysOnMarket: number | null; auctionClearanceRatePct: number | null; rentalYieldPct: number | null }>()
    for (const [key, rows] of bySuburb) {
        result.set(key, {
            daysOnMarket: weightedAverage(rows, (r) => r.daysOnMarket),
            auctionClearanceRatePct: (() => {
                const v = weightedAverage(rows, (r) => r.auctionClearanceRate)
                return v === null ? null : v * 100
            })(),
            rentalYieldPct: weightedAverage(rows, (r) => r.rentalYieldPct),
        })
    }
    return result
}

function loadPopulationGrowth(): Map<string, number> {
    const rows = parseCsv(ABS_POPULATION_CSV_PATH)
    const bySuburb = new Map<string, { year: number; value: number }[]>()

    for (const r of rows) {
        if (r.sa2_name.trim().toLowerCase() !== r.query_suburb.trim().toLowerCase()) continue // exact match only
        const key = `${r.query_suburb}|${r.query_state}`
        const year = toNumberOrNull(r.year)
        const value = toNumberOrNull(r.estimated_resident_population)
        if (year === null || value === null) continue
        if (!bySuburb.has(key)) bySuburb.set(key, [])
        bySuburb.get(key)!.push({ year, value })
    }

    const result = new Map<string, number>()
    for (const [key, points] of bySuburb) {
        if (points.length < 2) continue
        points.sort((a, b) => a.year - b.year)
        const earliest = points[0]
        const latest = points[points.length - 1]
        if (earliest.value === 0) continue
        result.set(key, ((latest.value - earliest.value) / earliest.value) * 100)
    }
    return result
}

function loadLatestPopulation(): Map<string, number> {
    const rows = parseCsv(ABS_POPULATION_CSV_PATH)
    const bySuburb = new Map<string, { year: number; value: number }[]>()

    for (const r of rows) {
        if (r.sa2_name.trim().toLowerCase() !== r.query_suburb.trim().toLowerCase()) continue
        const key = `${r.query_suburb}|${r.query_state}`
        const year = toNumberOrNull(r.year)
        const value = toNumberOrNull(r.estimated_resident_population)
        if (year === null || value === null) continue
        if (!bySuburb.has(key)) bySuburb.set(key, [])
        bySuburb.get(key)!.push({ year, value })
    }

    const result = new Map<string, number>()
    for (const [key, points] of bySuburb) {
        points.sort((a, b) => b.year - a.year)
        result.set(key, points[0].value)
    }
    return result
}

function loadSupplyConstraint(latestPopulation: Map<string, number>): Map<string, number> {
    const rows = parseCsv(ABS_BUILDING_APPROVALS_CSV_PATH)
    const bySuburb = new Map<string, { financialYear: string; value: number }[]>()

    for (const r of rows) {
        if (r.sa2_name.trim().toLowerCase() !== r.query_suburb.trim().toLowerCase()) continue // exact match only
        const key = `${r.query_suburb}|${r.query_state}`
        const value = toNumberOrNull(r.dwelling_approvals)
        if (value === null) continue
        if (!bySuburb.has(key)) bySuburb.set(key, [])
        bySuburb.get(key)!.push({ financialYear: r.financial_year, value })
    }

    const result = new Map<string, number>()
    for (const [key, points] of bySuburb) {
        points.sort((a, b) => (a.financialYear < b.financialYear ? 1 : -1)) // descending, e.g. "2022-23" first
        const mostRecentApprovals = points[0].value
        const population = latestPopulation.get(key)
        if (!population || population <= 0) continue
        result.set(key, (mostRecentApprovals / population) * 1000)
    }
    return result
}

function loadVacancyRates(): Map<string, number> {
    const rows = parseCsv(SQM_VACANCY_CSV_PATH)
    const bySuburb = new Map<string, { year: number; month: number; vr: number }[]>()

    for (const r of rows) {
        const key = `${r.suburb}|${r.state}`
        const year = toNumberOrNull(r.year)
        const month = toNumberOrNull(r.month)
        const vr = toNumberOrNull(r.vr)
        if (year === null || month === null || vr === null) continue
        if (!bySuburb.has(key)) bySuburb.set(key, [])
        bySuburb.get(key)!.push({ year, month, vr })
    }

    const result = new Map<string, number>()
    for (const [key, points] of bySuburb) {
        points.sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month))
        result.set(key, points[0].vr * 100)
    }
    return result
}

async function main() {
    const domainAggregates = loadDomainAggregates()
    const populationGrowth = loadPopulationGrowth()
    const latestPopulation = loadLatestPopulation()
    const supplyConstraint = loadSupplyConstraint(latestPopulation)
    const vacancyRates = loadVacancyRates()

    const allKeys = new Set<string>([
        ...domainAggregates.keys(),
        ...populationGrowth.keys(),
        ...supplyConstraint.keys(),
        ...vacancyRates.keys(),
    ])

    let updated = 0
    let skippedNoExistingRow = 0

    for (const key of allKeys) {
        const [suburb, state] = key.split('|')
        const existing = await prisma.marketIntelligence.findUnique({ where: { suburb_state: { suburb, state } } })
        if (!existing) {
            skippedNoExistingRow++
            continue
        }

        const domain = domainAggregates.get(key)

        await prisma.marketIntelligence.update({
            where: { suburb_state: { suburb, state } },
            data: {
                daysOnMarket: domain?.daysOnMarket !== null && domain?.daysOnMarket !== undefined ? Math.round(domain.daysOnMarket) : existing.daysOnMarket,
                rentalYieldPct: domain?.rentalYieldPct ?? existing.rentalYieldPct,
                auctionClearanceRatePct: domain?.auctionClearanceRatePct ?? existing.auctionClearanceRatePct,
                populationGrowthPct: populationGrowth.get(key) ?? existing.populationGrowthPct,
                supplyConstraintDwellingApprovalsPer1000: supplyConstraint.get(key) ?? existing.supplyConstraintDwellingApprovalsPer1000,
                vacancyRatePct: vacancyRates.get(key) ?? existing.vacancyRatePct,
            },
        })
        updated++
        console.log(`Updated ${suburb} ${state}`)
    }

    console.log(`\nDone. Updated: ${updated}, skipped (no existing MarketIntelligence row): ${skippedNoExistingRow}`)
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
