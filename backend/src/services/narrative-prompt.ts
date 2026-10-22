// Author: The Long Tran
// Builds the fine-tuned narrative model's prompt in exactly the format it was
// trained on — a line-for-line port of build_prompt() in
// data_ai/scripts/prepare_finetune_dataset.py — and splits the model's answer
// back into its sections. Any drift between the two puts production
// off-distribution, so tests/narrative-prompt.test.ts rebuilds every training
// prompt from its raw inputs and requires an exact match.

export type NarrativeRole = 'agent' | 'valuer' | 'buyer' | 'investor'

export const ROLE_LABEL: Record<NarrativeRole, string> = {
    agent: 'real estate agent',
    valuer: 'certified practising valuer',
    buyer: "buyer's advocate",
    investor: 'property investment advisor',
}

export const REPORT_TYPE_LABEL: Record<NarrativeRole, string> = {
    agent: 'Vendor Appraisal',
    valuer: 'Bank Valuation',
    buyer: 'Buyer Report',
    investor: 'Investment Report',
}

const SECTIONS_REQUIRED: Record<NarrativeRole, string> = {
    agent: 'the Appraisal Commentary section',
    valuer: 'the Appraisal Commentary section',
    buyer: 'the Appraisal Commentary section and the Affordability Assessment section',
    investor: 'the Appraisal Commentary section and the Growth Outlook section',
}

export const COMMENTARY_HEADING = 'APPRAISAL COMMENTARY'

type Num = number | null | undefined

export type NarrativeComparable = {
    address: string
    soldPrice: number
    soldDate: Date | string
    bedrooms: number
    bathrooms: number
    parking: number
    areaSqm?: Num
}

export type NarrativeRoiInput = {
    inputs: { purchasePrice: number; deposit: number; interestRate: number; weeklyRent: number }
    grossYieldPct: number
    netYieldPct: number
    monthlyCashFlow: number
    cashOnCashReturnPct: number | null
}

export type NarrativeAffordabilityInput = {
    inputs: { yourAnnualIncome: number; partnerAnnualIncome?: number; availableDeposit: number }
    estimatedBorrowingCapacity: number
    maxLoanAmount: number
    repaymentToIncomePct: number
}

export type NarrativePromptInput = {
    role: NarrativeRole
    subject: {
        street: string
        suburb: string
        state: string
        postcode: string
        propertyType?: string
        bedrooms?: number
        bathrooms?: number
        parking?: number
        areaSqm?: Num
    }
    estimatedValue: number
    comparables: NarrativeComparable[]
    market: {
        medianPrice: Num
        medianPriceGrowthPct: Num
        monthlyGrowthPct: Num
        daysOnMarket: Num
        rentalYieldPct: Num
        auctionClearanceRatePct: Num
        vacancyRatePct: Num
    }
    roi?: NarrativeRoiInput | null
    affordability?: NarrativeAffordabilityInput | null
}

// Python's round() rounds exact halves to the nearest even integer.
function roundHalfEven(value: number): number {
    return Math.abs(value % 1) === 0.5 ? 2 * Math.round(value / 2) : Math.round(value)
}

function groupThousands(value: number): string {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Python f"${round(n):,}" — a negative prints as "$-6,056".
export function money(value: Num): string {
    if (value === null || value === undefined) return 'unknown'
    const rounded = roundHalfEven(value)
    return `$${rounded < 0 ? '-' : ''}${groupThousands(Math.abs(rounded))}`
}

// prepare_finetune_dataset.py's num(): optionally rounded, trailing ".0" dropped.
export function num(value: Num, digits?: number): string {
    if (value === null || value === undefined) return 'unknown'
    const rounded = digits === undefined ? value : Number(value.toFixed(digits))
    if (Object.is(rounded, -0)) return '-0'
    return String(rounded)
}

function text(value: string | number | null | undefined): string {
    return value === null || value === undefined ? 'unknown' : String(value)
}

function isoDate(value: Date | string): string {
    return (value instanceof Date ? value.toISOString() : value).slice(0, 10)
}

// Drops repeats of the same sale (same address, price and date), keeping order.
export function uniqueComparables(comparables: NarrativeComparable[]): NarrativeComparable[] {
    const seen = new Set<string>()
    return comparables.filter((c) => {
        const key = `${c.address}|${c.soldPrice}|${isoDate(c.soldDate)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

export function buildNarrativePrompt(input: NarrativePromptInput): string {
    const { role, subject: s, market: m } = input
    const lines = [
        `You are a professional ${ROLE_LABEL[role]} preparing the narrative sections of a ${REPORT_TYPE_LABEL[role]} report.`,
        '',
        'Property:',
        `- Address: ${s.street}, ${s.suburb} ${s.state} ${s.postcode}`,
        `- Type: ${text(s.propertyType)}, ${text(s.bedrooms)} bed / ${text(s.bathrooms)} bath / ` +
            `${text(s.parking)} car, ${text(s.areaSqm)} sqm`,
        '',
        `Estimated value: ${money(input.estimatedValue)}`,
        '',
        'Comparable sales:',
    ]
    for (const c of uniqueComparables(input.comparables)) {
        lines.push(
            `- ${c.address}: ${money(c.soldPrice)}, sold ${isoDate(c.soldDate)}, ` +
                `${c.bedrooms} bed / ${c.bathrooms} bath / ${c.parking} car, ${text(c.areaSqm)} sqm`,
        )
    }

    lines.push(
        '',
        `Market data for ${s.suburb}:`,
        `- Median price: ${money(m.medianPrice)} (${num(m.medianPriceGrowthPct)}% annual growth, ` +
            `${num(m.monthlyGrowthPct, 1)}% monthly)`,
        `- Median days on market: ${num(m.daysOnMarket)}`,
        `- Rental yield: ${num(m.rentalYieldPct, 2)}%`,
        `- Auction clearance rate: ${num(m.auctionClearanceRatePct, 1)}%`,
        `- Vacancy rate: ${num(m.vacancyRatePct, 2)}%`,
    )

    if (role === 'investor' && input.roi) {
        const roi = input.roi
        lines.push(
            '',
            'Financing assumptions:',
            `- Purchase price: ${money(roi.inputs.purchasePrice)}`,
            `- Deposit: ${money(roi.inputs.deposit)}`,
            `- Loan interest rate: ${num(roi.inputs.interestRate)}%`,
            `- Estimated weekly rent: ${money(roi.inputs.weeklyRent)}`,
            '',
            'ROI figures (calculated, do not recompute):',
            `- Gross rental yield: ${num(roi.grossYieldPct, 2)}%`,
            `- Net rental yield: ${num(roi.netYieldPct, 2)}%`,
            `- Monthly cash flow: ${money(roi.monthlyCashFlow)}`,
            `- Cash-on-cash return: ${num(roi.cashOnCashReturnPct, 2)}%`,
        )
    }

    if (role === 'buyer' && input.affordability) {
        const aff = input.affordability
        const partner = aff.inputs.partnerAnnualIncome ? ` + partner ${money(aff.inputs.partnerAnnualIncome)}` : ''
        lines.push(
            '',
            'Buyer financial profile (as entered):',
            `- Gross annual income: ${money(aff.inputs.yourAnnualIncome)}${partner}`,
            `- Deposit available: ${money(aff.inputs.availableDeposit)}`,
            '',
            'Affordability figures (calculated, do not recompute):',
            `- Estimated borrowing capacity: ${money(aff.estimatedBorrowingCapacity)}`,
            `- Maximum loan amount: ${money(aff.maxLoanAmount)}`,
            `- Repayment as % of income: ${num(aff.repaymentToIncomePct)}%`,
        )
    }

    lines.push(
        '',
        `Write ${SECTIONS_REQUIRED[role]} exactly as they would appear in the generated report, ` +
            'with the same section headings, grounded strictly in the data above. ' +
            'Do not invent any figures not present above.',
    )
    return lines.join('\n')
}

export type NarrativeSection = { heading: string; paragraphs: string[] }

const HEADING_LINE = /^[A-Z][A-Z &]+$/

// Splits the model's answer on its all-caps heading lines ("APPRAISAL
// COMMENTARY", "GROWTH OUTLOOK", ...) so the heading text is never shown as
// a paragraph. Text before any heading is treated as the commentary.
export function parseNarrativeSections(answer: string): NarrativeSection[] {
    const sections: NarrativeSection[] = []
    let current: NarrativeSection | null = null
    for (const block of answer.split(/\n\s*\n/)) {
        const trimmed = block.trim()
        if (!trimmed) continue
        const [firstLine, ...rest] = trimmed.split('\n')
        if (HEADING_LINE.test(firstLine.trim())) {
            current = { heading: firstLine.trim(), paragraphs: [] }
            sections.push(current)
            const remainder = rest.join('\n').trim()
            if (remainder) current.paragraphs.push(remainder)
            continue
        }
        if (!current) {
            current = { heading: COMMENTARY_HEADING, paragraphs: [] }
            sections.push(current)
        }
        current.paragraphs.push(trimmed)
    }
    return sections.filter((section) => section.paragraphs.length > 0)
}
