// One-off real-data import: reads data_ai/bronze_listings.csv (real sold
// NSW listings scraped from domain.com.au) and inserts them as real
// Property + ComparableSale rows. Ports the cleaning rules already proven
// in data_ai/ingestion/clean_listings.py (same postcode lookup source,
// same property-type normalization) rather than inventing new ones.
//
// Never fabricates a value it can't derive — a row with no resolvable
// postcode, no recognizable property type, or a missing required field is
// skipped, not filled in with a guess. Re-run manually after any
// `prisma migrate reset` (not part of prisma:seed, which wipes
// Property/ComparableSale on every run and is meant to be fast/repeatable
// dev seed data, not a 40k-row import).
//
// Usage: npx tsx scripts/ingest-bronze-listings.ts
import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CSV_PATH = process.env.BRONZE_CSV_PATH ?? '../data_ai/bronze_listings.csv'
const POSTCODE_LOOKUP_URL =
    'https://raw.githubusercontent.com/Elkfox/Australian-Postcode-Data/master/au_postcodes.csv'
const BATCH_SIZE = 500

// Our dropdown only accepts these five values (getPropertyTypeOptions) —
// anything that doesn't clearly map to one is skipped, never defaulted.
function normalizePropertyType(raw: string): string | null {
    const lower = raw.trim().toLowerCase()
    if (!lower) return null
    if (lower.includes('townhouse')) return 'Townhouse'
    if (lower.includes('villa')) return 'Villa'
    if (lower.includes('apartment')) return 'Apartment'
    if (lower.includes('unit') || lower.includes('flat')) return 'Unit'
    if (lower.includes('house')) return 'House'
    return null // agent names, "land", or anything else unrecognized
}

function parsePrice(raw: string): number | null {
    const cleaned = raw.replace(/[^0-9.]/g, '')
    if (!cleaned) return null
    const value = Number(cleaned)
    return Number.isFinite(value) && value > 0 ? value : null
}

const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

// listing_date is a sentence like "Sold at auction 24 Jul 2026" — extract
// the trailing "D Mon YYYY" pattern, same as the Python cleaner's regex.
function parseSoldDate(raw: string): Date | null {
    const match = raw.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i)
    if (!match) return null
    const day = Number(match[1])
    const month = MONTHS[match[2].toLowerCase()]
    const year = Number(match[3])
    const date = new Date(Date.UTC(year, month, day))
    return Number.isNaN(date.getTime()) ? null : date
}

function parseIntOrNull(raw: string): number | null {
    const digits = raw.replace(/[^0-9]/g, '')
    if (!digits) return null
    return Number(digits)
}

// Minimal CSV line parser — handles quoted fields with embedded commas and
// escaped quotes (bronze_listings.csv has a raw_payload JSON blob column).
function parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"'
                    i++
                } else {
                    inQuotes = false
                }
            } else {
                current += char
            }
        } else if (char === '"') {
            inQuotes = true
        } else if (char === ',') {
            result.push(current)
            current = ''
        } else {
            current += char
        }
    }
    result.push(current)
    return result
}

async function loadPostcodeLookup(): Promise<Map<string, string>> {
    console.log('Fetching Australian postcode lookup...')
    const response = await fetch(POSTCODE_LOOKUP_URL)
    if (!response.ok) {
        throw new Error(`Failed to fetch postcode lookup: ${response.status}`)
    }
    const text = await response.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const header = parseCsvLine(lines[0])
    const postcodeIdx = header.indexOf('postcode')
    const placeNameIdx = header.indexOf('place_name')
    const stateCodeIdx = header.indexOf('state_code')

    const lookup = new Map<string, string>()
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i])
        const suburb = cols[placeNameIdx]?.trim().toLowerCase()
        const state = cols[stateCodeIdx]?.trim().toUpperCase()
        const postcode = cols[postcodeIdx]?.trim()
        if (!suburb || !state || !postcode) continue
        const key = `${suburb}|${state}`
        if (!lookup.has(key)) lookup.set(key, postcode) // first match wins, matches Python cleaner
    }
    console.log(`Loaded ${lookup.size} suburb->postcode mappings.`)
    return lookup
}

type CleanedRow = {
    addressLine: string
    suburb: string
    state: string
    postcode: string
    propertyType: string
    bedrooms: number
    bathrooms: number
    parking: number
    areaSqm: number
    soldPrice: number
    soldDate: Date
}

async function main() {
    const postcodeLookup = await loadPostcodeLookup()

    const skipCounts: Record<string, number> = {
        propertyType: 0,
        postcode: 0,
        bedrooms: 0,
        bathrooms: 0,
        parking: 0,
        areaSqm: 0,
        price: 0,
        soldDate: 0,
        malformed: 0,
    }

    let header: string[] | null = null
    let colIdx: Record<string, number> = {}
    let totalRows = 0
    let importedRows = 0
    let propertyBatch: { data: Record<string, unknown> }[] = []
    let saleBatch: { propertyId: string; soldPrice: number; soldDate: Date }[] = []

    async function flushBatch() {
        if (propertyBatch.length === 0) return
        await prisma.property.createMany({ data: propertyBatch.map((p) => p.data) as never })
        await prisma.comparableSale.createMany({
            data: saleBatch.map((s) => ({
                comparableId: randomUUID(),
                propertyId: s.propertyId,
                soldPrice: s.soldPrice,
                soldDate: s.soldDate,
            })),
        })
        propertyBatch = []
        saleBatch = []
    }

    const rl = createInterface({ input: createReadStream(CSV_PATH, 'utf-8'), crlfDelay: Infinity })

    for await (const line of rl) {
        if (!line.trim()) continue

        if (!header) {
            header = parseCsvLine(line)
            colIdx = Object.fromEntries(header.map((h, i) => [h, i]))
            continue
        }

        totalRows++
        const cols = parseCsvLine(line)
        if (cols.length < header.length) {
            skipCounts.malformed++
            continue
        }

        const get = (name: string) => (cols[colIdx[name]] ?? '').trim()

        const address = get('address')
        const suburb = get('suburb')
        const state = get('state').toUpperCase()

        const propertyType = normalizePropertyType(get('property_type'))
        if (!propertyType) {
            skipCounts.propertyType++
            continue
        }

        const postcode = postcodeLookup.get(`${suburb.toLowerCase()}|${state}`)
        if (!postcode) {
            skipCounts.postcode++
            continue
        }

        const bedrooms = parseIntOrNull(get('bedrooms'))
        if (bedrooms === null) {
            skipCounts.bedrooms++
            continue
        }

        const bathrooms = parseIntOrNull(get('bathrooms'))
        if (bathrooms === null) {
            skipCounts.bathrooms++
            continue
        }

        const parking = parseIntOrNull(get('parking'))
        if (parking === null) {
            skipCounts.parking++
            continue
        }

        const areaSqm = parseIntOrNull(get('land_size_sqm'))
        if (areaSqm === null) {
            skipCounts.areaSqm++
            continue
        }

        const soldPrice = parsePrice(get('price'))
        if (soldPrice === null) {
            skipCounts.price++
            continue
        }

        const soldDate = parseSoldDate(get('listing_date'))
        if (!soldDate) {
            skipCounts.soldDate++
            continue
        }

        if (!address || !suburb || !state) {
            skipCounts.malformed++
            continue
        }

        const propertyId = randomUUID()
        propertyBatch.push({
            data: {
                propertyId,
                addressLine: address,
                suburb,
                state,
                postcode,
                propertyType,
                bedrooms,
                bathrooms,
                parking,
                areaSqm,
            },
        })
        saleBatch.push({ propertyId, soldPrice, soldDate })
        importedRows++

        if (propertyBatch.length >= BATCH_SIZE) {
            await flushBatch()
            console.log(`Progress: ${importedRows} imported / ${totalRows} read`)
        }
    }

    await flushBatch()

    console.log('\n--- Import complete ---')
    console.log(`Total rows read: ${totalRows}`)
    console.log(`Imported: ${importedRows}`)
    console.log('Skipped (breakdown):', skipCounts)
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
