// Templated wording for the generated report — replaces the old 100%
// static fictional content (a fixed invented South Yarra property) with
// real sentences built from actual comparable sales and market data.
// Reuses comparable-sale.service's findComparablesInSuburb (same set
// Step 1 shows) and market-intelligence.service's suburb lookup — no new
// data source needed.
import { findComparablesInSuburb } from './comparable-sale.service.js'
import { getMarketIntelligenceOverviewForSuburb } from './market-intelligence.service.js'
import { predictPropertyPrice } from './price-prediction.service.js'
import { generateNarrativeViaVertex } from './vertex-narrative.service.js'

export type ReportRole = 'agent' | 'valuer' | 'buyer' | 'investor'

// Mirrors data_ai/scripts/prepare_finetune_dataset.py's ROLE_LABEL /
// REPORT_TYPE_LABEL exactly — the fine-tune learned to change tone and
// content based on these two sentences, so production has to send the
// same wording or the model is off-distribution from training.
const ROLE_LABEL: Record<ReportRole, string> = {
    agent: 'real estate agent',
    valuer: 'certified practising valuer',
    buyer: "buyer's advocate",
    investor: 'property investment advisor',
}

const REPORT_TYPE_LABEL: Record<ReportRole, string> = {
    agent: 'Vendor Appraisal',
    valuer: 'Bank Valuation',
    buyer: 'Buyer Report',
    investor: 'Investment Report',
}

export type ReportTemplate = {
    id: string
    title: string
    description: string
    iconKey: 'vendor' | 'bank' | 'buyer' | 'investment'
    includes: string[]
}

// Locked one-per-role — no free choice, matches the design decision.
const REPORT_TEMPLATES: Record<ReportRole, ReportTemplate> = {
    agent: {
        id: 'vendor-appraisal',
        title: 'Vendor Appraisal',
        description:
            'A comprehensive market appraisal for property owners preparing to sell. Includes estimated value range, comparable sales evidence, and campaign strategy.',
        iconKey: 'vendor',
        includes: [
            'Estimated Value Range',
            'Market Analysis',
            'Property Description',
            'Comparable Sales Evidence',
            'Campaign Strategy',
            'Vendor Recommendation',
        ],
    },
    valuer: {
        id: 'bank-valuation',
        title: 'Bank Valuation',
        description:
            'A formal valuation report prepared for lending and mortgage security purposes. Includes estimated value, comparable sales evidence, and risk assessment for lender review.',
        iconKey: 'bank',
        includes: [
            'Estimated Value Range',
            'Market Analysis',
            'Property Description',
            'Comparable Sales Evidence',
            'Risk & Compliance Assessment',
            'Valuer Certification',
        ],
    },
    buyer: {
        id: 'buyer-report',
        title: "Buyer's Report",
        description:
            'A market analysis prepared for prospective buyers, helping assess whether an asking price reflects fair market value before making an offer.',
        iconKey: 'buyer',
        includes: [
            'Estimated Value Range',
            'Market Analysis',
            'Property Description',
            'Comparable Sales Evidence',
            'Negotiation Guidance',
            'Affordability Assessment',
        ],
    },
    investor: {
        id: 'investment-report',
        title: 'Investment Report',
        description:
            'A market and yield analysis prepared for property investors, combining comparable sales evidence with market trend data to assess investment potential.',
        iconKey: 'investment',
        includes: [
            'Estimated Value Range',
            'Market Analysis',
            'Property Description',
            'Comparable Sales Evidence',
            'Growth Outlook',
        ],
    },
}

export function getReportTemplateForRole(role: ReportRole): ReportTemplate {
    return REPORT_TEMPLATES[role]
}

type SubjectInput = {
    suburb: string
    state?: string
    postcode?: string
    street: string
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    parking?: number
    landSizeSqm?: number
}

function formatCurrency(value: number): string {
    return `$${Math.round(value).toLocaleString('en-AU')}`
}

async function buildRealEvidence(subject: SubjectInput) {
    const comparables = await findComparablesInSuburb({
        suburb: subject.suburb,
        propertyType: subject.propertyType,
        bedrooms: subject.bedrooms,
        bathrooms: subject.bathrooms,
        parking: subject.parking,
    })

    const market = await getMarketIntelligenceOverviewForSuburb(subject.suburb, subject.state)
    const growthStat = market.stats.find((stat) => stat.id === 'median-price')
    const daysStat = market.stats.find((stat) => stat.id === 'days-on-market')

    if (comparables.length === 0) {
        return { comparables, midpoint: 0, priceRangeText: null, primaryComparable: null, growthStat, daysStat }
    }

    const prices = comparables.map((row) => row.soldPrice)
    const comparableAverage = prices.reduce((sum, price) => sum + price, 0) / prices.length
    const min = Math.min(...prices)
    const max = Math.max(...prices)

    // Same ML-first, comparable-average-fallback rule as
    // appraisal-summary.controller.ts's headline midpoint — this used to be
    // its own independent comparable average, which meant this report's
    // prose could (and did) disagree with the header's midpoint whenever
    // the ML model was actually reachable.
    const predictedPrice =
        subject.state && subject.postcode
            ? await predictPropertyPrice({
                  suburb: subject.suburb,
                  state: subject.state,
                  postcode: subject.postcode,
                  propertyType: subject.propertyType,
                  bedrooms: subject.bedrooms,
                  bathrooms: subject.bathrooms,
                  parking: subject.parking,
                  landSizeSqm: subject.landSizeSqm,
              })
            : null
    const midpoint = predictedPrice ?? comparableAverage

    return {
        comparables,
        midpoint,
        priceRangeText: `${formatCurrency(min)} – ${formatCurrency(max)}`,
        primaryComparable: comparables[0], // findComparablesInSuburb already sorts by similarity, best match first
        growthStat,
        daysStat,
    }
}

export async function buildExecutiveSummary(subject: SubjectInput, role: ReportRole) {
    const evidence = await buildRealEvidence(subject)

    if (evidence.comparables.length === 0) {
        return {
            title: '1. EXECUTIVE SUMMARY',
            paragraphs: [
                [{ text: `No comparable sales were found for ${subject.suburb} to base an estimate on.` }],
            ],
            observationTitle: 'Key Observation',
            observationMessage: 'No comparable evidence is currently available for this suburb.',
        }
    }

    const midpointText = formatCurrency(evidence.midpoint)
    const growthText = evidence.growthStat ? evidence.growthStat.trend : 'unavailable'

    const observationTitle = 'Key Observation'
    const observationMessage = evidence.primaryComparable
        ? `The primary comparable — ${evidence.primaryComparable.property.addressLine} (sold ${formatCurrency(evidence.primaryComparable.soldPrice)}) — is the strongest evidence for this estimate given its similarity to the subject property.`
        : 'No single comparable stands out as a primary anchor for this estimate.'

    const vertexParagraphs = await tryVertexExecutiveSummary(subject, role, evidence, midpointText, growthText)
    if (vertexParagraphs) {
        return {
            title: '1. EXECUTIVE SUMMARY',
            paragraphs: vertexParagraphs,
            observationTitle,
            observationMessage,
        }
    }

    return {
        title: '1. EXECUTIVE SUMMARY',
        paragraphs: [
            [
                {
                    text: `This ${subject.propertyType ?? 'property'} at ${subject.street}, ${subject.suburb} has been assessed based on ${evidence.comparables.length} comparable sale${evidence.comparables.length === 1 ? '' : 's'} in the area, together with current suburb market data.`,
                },
            ],
            [
                {
                    text: 'Based on this evidence, the estimated value range is ',
                },
                { text: evidence.priceRangeText ?? '', highlight: true },
                {
                    text: `, with a midpoint estimate of ${midpointText}. The ${subject.suburb} market has recorded ${growthText} annual growth${evidence.daysStat ? `, with a median of ${evidence.daysStat.value} days on market` : ''}.`,
                },
            ],
        ],
        observationTitle,
        observationMessage,
    }
}

// Connection-test integration (2026-09-12): tries the live Vertex AI
// endpoint (base Gemma 2 9B-it, not fine-tuned yet) before falling back to
// the templated paragraphs above. Returns null on any failure so the
// templated path is always the safety net.
async function tryVertexExecutiveSummary(
    subject: SubjectInput,
    role: ReportRole,
    evidence: Awaited<ReturnType<typeof buildRealEvidence>>,
    midpointText: string,
    growthText: string,
): Promise<{ text: string }[][] | null> {
    if (evidence.comparables.length === 0) return null

    const comparableLines = evidence.comparables
        .slice(0, 5)
        .map((c) => `- ${c.property.addressLine}: ${formatCurrency(c.soldPrice)}`)
        .join('\n')

    const prompt = [
        `You are a professional ${ROLE_LABEL[role]} preparing the narrative sections of a ${REPORT_TYPE_LABEL[role]} report.`,
        ``,
        `Property: ${subject.street}, ${subject.suburb} ${subject.state ?? ''} — ${subject.propertyType ?? 'property'}, ${subject.bedrooms ?? '?'} bed / ${subject.bathrooms ?? '?'} bath / ${subject.parking ?? '?'} car, ${subject.landSizeSqm ?? 'unknown'} sqm`,
        `Estimated value: ${midpointText} (range ${evidence.priceRangeText})`,
        `Suburb annual growth: ${growthText}`,
        ``,
        `Comparable sales:`,
        comparableLines,
        ``,
        `Write only the Executive Summary section (2 short paragraphs), grounded strictly in the data above. Do not invent any figures not present above.`,
    ].join('\n')

    const text = await generateNarrativeViaVertex(prompt)
    if (!text) return null

    const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => [{ text: p }])

    return paragraphs.length > 0 ? paragraphs : null
}

export async function buildNarrativePreview(subject: SubjectInput, templateTitle: string) {
    const evidence = await buildRealEvidence(subject)

    if (evidence.comparables.length === 0) {
        return {
            title: templateTitle,
            sections: [
                {
                    heading: 'Executive Summary:',
                    body: `No comparable sales were found for ${subject.suburb} to base an estimate on.`,
                },
            ],
            disclaimer:
                'Full report will include comprehensive analysis, comparable sales evidence, and market intelligence.',
        }
    }

    const midpointText = formatCurrency(evidence.midpoint)
    const growthText = evidence.growthStat ? evidence.growthStat.trend : 'unavailable'

    return {
        title: templateTitle,
        sections: [
            {
                heading: 'Executive Summary:',
                body: `This ${subject.propertyType ?? 'property'} at ${subject.street}, ${subject.suburb} represents an assessed opportunity based on ${evidence.comparables.length} comparable sale${evidence.comparables.length === 1 ? '' : 's'}, indicating an estimated value of ${midpointText}.`,
            },
            {
                heading: 'Market Analysis:',
                body: `${subject.suburb} has recorded ${growthText} annual growth${evidence.daysStat ? `, with properties taking a median of ${evidence.daysStat.value} days to sell` : ''}. The estimated range for this property is ${evidence.priceRangeText}.`,
            },
        ],
        disclaimer:
            'Full report will include comprehensive analysis, comparable sales evidence, and market intelligence.',
    }
}

// Generic strategic advice — not a factual claim about a specific
// property, so it's fine as static content (unlike propertySpecificFactors,
// which was dropped entirely for making up specific property features).
export function getAgentRecommendations() {
    return {
        title: '2. AGENT RECOMMENDATIONS',
        items: [
            {
                id: 'campaign',
                title: 'Campaign Strategy',
                description:
                    'A four-week campaign is recommended to build buyer momentum. Set a price guide close to the estimated range to attract the widest possible buyer pool.',
                iconKey: 'campaign',
            },
            {
                id: 'presentation',
                title: 'Presentation Priorities',
                description:
                    'Professional photography and light styling typically improve buyer engagement. Ensure the property is presented at its best before the campaign begins.',
                iconKey: 'presentation',
            },
            {
                id: 'marketing',
                title: 'Marketing Channels',
                description:
                    'A mix of digital listing platforms and social media typically reaches the broadest buyer audience for this property type.',
                iconKey: 'marketing',
                highlighted: true,
            },
        ],
    }
}

export type GrowthOutlookRoiInput = {
    grossYieldPct: number
    netYieldPct: number
    monthlyCashFlow: number
    cashOnCashReturnPct: number | null
}

// Investor-only section — quotes the real numbers the investor computed in
// the ROI Analysis wizard step (or the ones saved on a reopened report), not
// a fabricated estimate. If they never ran that step, says so honestly
// rather than inventing figures.
export function buildGrowthOutlook(roi: GrowthOutlookRoiInput | null) {
    if (!roi) {
        return {
            title: '5. GROWTH OUTLOOK',
            paragraphs: [
                [
                    {
                        text: 'Run the ROI Analysis step to see projected rental yield and cash flow figures for this property.',
                    },
                ],
            ],
        }
    }

    const cashFlowText =
        roi.monthlyCashFlow >= 0
            ? `a projected positive monthly cash flow of ${formatCurrency(roi.monthlyCashFlow)}`
            : `a projected monthly shortfall of ${formatCurrency(Math.abs(roi.monthlyCashFlow))}`

    const cashOnCashText =
        roi.cashOnCashReturnPct === null
            ? 'A cash-on-cash return could not be calculated without a deposit amount.'
            : `This represents a cash-on-cash return of ${roi.cashOnCashReturnPct.toFixed(1)}%.`

    return {
        title: '5. GROWTH OUTLOOK',
        paragraphs: [
            [
                {
                    text: `Based on the financing and rental assumptions entered for this property, it is projected to generate a gross rental yield of ${roi.grossYieldPct.toFixed(1)}% and a net yield of ${roi.netYieldPct.toFixed(1)}%.`,
                },
            ],
            [{ text: `After financing costs, this translates to ${cashFlowText}. ${cashOnCashText}` }],
        ],
    }
}

export type AffordabilityOutlookInput = {
    estimatedBorrowingCapacity: number
    maxLoanAmount: number
    repaymentToIncomePct: number
}

// Buyer-only section — quotes the real numbers computed in the
// Affordability wizard step (or saved on a reopened report), not a
// fabricated estimate. If they never ran that step, says so honestly.
export function buildAffordabilityOutlook(affordability: AffordabilityOutlookInput | null) {
    if (!affordability) {
        return {
            title: '5. AFFORDABILITY ASSESSMENT',
            paragraphs: [
                [
                    {
                        text: 'Run the Affordability Calculator step to see borrowing capacity figures for this property.',
                    },
                ],
            ],
        }
    }

    const band =
        affordability.repaymentToIncomePct <= 30
            ? 'comfortably within typical lending guidelines'
            : affordability.repaymentToIncomePct <= 45
              ? 'within a moderate range for typical lending guidelines'
              : 'stretched relative to typical lending guidelines'

    return {
        title: '5. AFFORDABILITY ASSESSMENT',
        paragraphs: [
            [
                {
                    text: `Based on the income and expenses entered, the estimated borrowing capacity is ${formatCurrency(affordability.estimatedBorrowingCapacity)}, including a maximum loan amount of ${formatCurrency(affordability.maxLoanAmount)}.`,
                },
            ],
            [
                {
                    text: `The resulting repayment sits at ${affordability.repaymentToIncomePct.toFixed(0)}% of gross monthly income, which is ${band}.`,
                },
            ],
        ],
    }
}

export function getAppraisalDisclaimer() {
    return {
        title: 'Disclaimer:',
        message:
            'This report was prepared using automated market analysis and is intended as a guidance tool only. It does not constitute a formal property valuation under the Valuers Act 2003 (Vic) and should not be relied upon as such in legal, financial, or lending contexts. All figures are estimates based on available comparable sales and market data. Relaive recommends this report be reviewed by a licensed real estate agent or certified practising valuer before being presented to vendors or third parties. Market conditions may change; this appraisal has a recommended validity period of 90 days from the date of generation.',
        footer: 'Generated by Relaive · relaive.com.au',
    }
}
