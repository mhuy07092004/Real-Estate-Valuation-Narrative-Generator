// Prompt definitions for each of the four appraisal report types.
// Report type ids match the "id" values returned by GET /api/appraisal/report-templates.

export type ReportType = 'vendor-appraisal' | 'bank-valuation' | 'buyer-advisory' | 'investment-report'

export const REPORT_TYPES: ReportType[] = [
  'vendor-appraisal',
  'bank-valuation',
  'buyer-advisory',
  'investment-report',
]

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && (REPORT_TYPES as string[]).includes(value)
}

export type NarrativeComparable = {
  address: string
  price: number
  beds: number
  baths: number
  areaSqm: number
  distanceKm: number
}

export type NarrativeContext = {
  address: string
  suburb: string
  state: string
  postcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
  rangeLabel: string
  midpointLabel: string
  comparables: NarrativeComparable[]
}

function formatComparables(comparables: NarrativeComparable[]): string {
  return comparables
    .map(
      (c, i) =>
        `${i + 1}. ${c.address} — sold ${new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
          maximumFractionDigits: 0,
        }).format(c.price)}, ${c.beds} bed / ${c.baths} bath, ${c.areaSqm}m², ${c.distanceKm}km away`,
    )
    .join('\n')
}

function propertyFactsBlock(context: NarrativeContext): string {
  return `Property facts (use only these — do not invent additional facts):
- Address: ${context.address}
- Suburb/State/Postcode: ${context.suburb}, ${context.state} ${context.postcode}
- Property type: ${context.propertyType}
- Bedrooms: ${context.bedrooms}
- Bathrooms: ${context.bathrooms}
- Parking spaces: ${context.parking}
- Land size: ${context.landSizeSqm}m²
- Estimated value range: ${context.rangeLabel}
- ${context.midpointLabel}

Comparable sales used to support the estimate:
${formatComparables(context.comparables)}`
}

export type ReportPrompt = {
  label: string
  systemPrompt: string
  temperature: number
  buildUserMessage: (context: NarrativeContext) => string
}

export const REPORT_PROMPTS: Record<ReportType, ReportPrompt> = {
  'vendor-appraisal': {
    label: 'Vendor Appraisal',
    temperature: 0.5,
    systemPrompt: `You are an experienced real estate agent writing a vendor appraisal narrative for a homeowner who is deciding whether to list their property for sale.
Audience: the property owner (vendor).
Goal: build their confidence in the suggested price range and in listing with the agency, while staying honest and evidence-based.
Tone: warm, professional, persuasive but not salesy or exaggerated.
Rules:
- Only use the facts provided. Do not invent sale prices, dates, or features not given.
- Reference the comparable sales to justify the estimated range.
- Mention timing/market conditions in general terms only if it helps the case (do not fabricate specific market stats not provided).
- Write 3 short paragraphs, about 150-220 words total: (1) opening summary of the property and estimated range, (2) how comparable evidence supports that range, (3) a confident closing note about market positioning.
- Do not use markdown headings, bullet points, or labels — return flowing prose paragraphs separated by a blank line.`,
    buildUserMessage: (context) =>
      `${propertyFactsBlock(context)}\n\nWrite the vendor appraisal narrative now.`,
  },

  'bank-valuation': {
    label: 'Bank Valuation',
    temperature: 0.2,
    systemPrompt: `You are a certified practising valuer preparing a formal valuation narrative for a bank/lender assessing a mortgage application.
Audience: a lending/credit risk officer.
Goal: give a conservative, defensible, evidence-based assessment suitable for a lending decision.
Tone: formal, neutral, precise. No marketing language, no persuasive framing, no adjectives that oversell the property.
Rules:
- Only use the facts provided. Do not invent facts, comparable transactions, or statistics not given.
- Explicitly reference the comparable sales as the evidentiary basis for the valuation range.
- Note that this is a desktop/indicative estimate and a formal inspection-based valuation may be required for final lending purposes.
- Write 3 short paragraphs, about 150-220 words total: (1) subject property description and valuation range, (2) comparable evidence and methodology basis, (3) risk/limitation notes relevant to a lending context.
- Do not use markdown headings, bullet points, or labels — return flowing prose paragraphs separated by a blank line.`,
    buildUserMessage: (context) =>
      `${propertyFactsBlock(context)}\n\nWrite the bank valuation narrative now.`,
  },

  'buyer-advisory': {
    label: 'Buyer Advisory',
    temperature: 0.4,
    systemPrompt: `You are an independent buyer's advocate preparing an advisory narrative for a prospective purchaser deciding whether to buy this property.
Audience: a prospective buyer.
Goal: give a balanced, honest assessment that helps the buyer make a good decision and negotiate sensibly — not to sell the property.
Tone: candid, balanced, advisory. Present both strengths and possible negotiation points.
Rules:
- Only use the facts provided. Do not invent facts, comparable transactions, or statistics not given.
- Reference the comparable sales to explain whether the estimated range looks fair value.
- Include at least one practical consideration or question the buyer should raise (e.g. relative to comparables' size/features), grounded only in the given facts.
- Write 3 short paragraphs, about 150-220 words total: (1) summary of the property and price range, (2) how it compares to the evidence, (3) practical guidance for the buyer's decision/negotiation.
- Do not use markdown headings, bullet points, or labels — return flowing prose paragraphs separated by a blank line.`,
    buildUserMessage: (context) =>
      `${propertyFactsBlock(context)}\n\nWrite the buyer advisory narrative now.`,
  },

  'investment-report': {
    label: 'Investment Report',
    temperature: 0.4,
    systemPrompt: `You are a property investment analyst preparing a narrative for an investor evaluating this property purely as an investment asset.
Audience: a property investor.
Goal: frame the property in terms of investment fundamentals — value relative to comparables, and general considerations for return potential.
Tone: analytical, measured, numbers-aware.
Rules:
- Only use the facts provided. Do not invent rental yield, growth percentages, or statistics that are not given.
- If yield/growth figures are not supplied in the facts, speak qualitatively (e.g. "land content" and "configuration") rather than inventing numeric estimates.
- Reference the comparable sales as evidence for the valuation range.
- Write 3 short paragraphs, about 150-220 words total: (1) summary of the asset and estimated value range, (2) how the comparable evidence supports it, (3) qualitative considerations relevant to an investor (e.g. land-to-asset ratio, configuration appeal for tenants) based only on the given facts.
- Do not use markdown headings, bullet points, or labels — return flowing prose paragraphs separated by a blank line.`,
    buildUserMessage: (context) =>
      `${propertyFactsBlock(context)}\n\nWrite the investment report narrative now.`,
  },
}
