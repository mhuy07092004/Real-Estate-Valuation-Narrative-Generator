// Shared mock data — used by all 4 roles (notifications, AI copilot, date helpers).

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

export function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

// ---------------------------------------------------------------------------
// Notifications / disclaimers
// ---------------------------------------------------------------------------

/** Shared shape for role inbox notifications (data lives in mock-{role}.ts). */
export type NotificationPriority = 'high' | 'medium' | 'low'
export type NotificationIconKind = 'ai' | 'market' | 'approval' | 'sale' | 'forecast' | 'report'

export type InboxNotification = {
  id: string
  title: string
  description: string
  priority: NotificationPriority
  timestamp: string
  isRead: boolean
  icon: NotificationIconKind
}

export type NotificationMock = {
  message: string
}

const ROI_DISCLAIMER: NotificationMock = {
  message:
    'MOCK ONLY! - These calculations are estimates for indicative purposes only. They do not constitute financial advice. Consult a qualified financial adviser before making investment decisions.',
}

export function getRoiDisclaimerNotification(): NotificationMock {
  return ROI_DISCLAIMER
}

const AFFORDABILITY_DISCLAIMER: NotificationMock = {
  message:
    'MOCK ONLY! - These affordability figures are estimates for indicative purposes only. They do not constitute financial or lending advice. Confirm borrowing capacity with your lender before making purchase decisions.',
}

export function getAffordabilityDisclaimerNotification(): NotificationMock {
  return AFFORDABILITY_DISCLAIMER
}

// ---------------------------------------------------------------------------
// AI Copilot
// ---------------------------------------------------------------------------

export type CopilotConversation = {
  id: string
  title: string
  timestamp: string
  snippet: string
  pinned?: boolean
  active?: boolean
}

export type CopilotSuggestion = {
  id: string
  label: string
  icon: 'chart' | 'building' | 'compare' | 'document'
}

export type CopilotMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

export const MOCK_COPILOT_CONVERSATIONS: CopilotConversation[] = [
  {
    id: 'conv-richmond',
    title: 'Richmond Market Analysis',
    timestamp: 'Today',
    snippet: 'Analysed growth trends and comparable sales…',
    pinned: true,
    active: true,
  },
]

export const MOCK_COPILOT_SUGGESTIONS: CopilotSuggestion[] = [
  {
    id: 'sug-1',
    label: 'What are the market trends in Richmond VIC?',
    icon: 'chart',
  },
  {
    id: 'sug-2',
    label: 'Explain this AI valuation for 123 Smith St',
    icon: 'building',
  },
  {
    id: 'sug-3',
    label: 'Compare Surry Hills and Newtown for investment',
    icon: 'compare',
  },
  {
    id: 'sug-4',
    label: 'Rewrite my appraisal report in formal tone',
    icon: 'document',
  },
]

export const MOCK_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      "Hello! I'm your Relaive AI Copilot. I can help you analyse properties, understand market trends, explain valuations, and draft professional reports. What would you like to explore today?",
  },
]

// ---------------------------------------------------------------------------
// Stepper (appraisal / payment flows)
// ---------------------------------------------------------------------------

export type StepperStep = {
  id: string
  label: string
}

export const MOCK_APPRAISAL_STEPS: StepperStep[] = [
  { id: 'property-input', label: 'Property Input' },
  { id: 'ai-analysis', label: 'AI Analysis' },
  { id: 'comparables', label: 'Comparables' },
  { id: 'market-intelligence', label: 'Market Intelligence' },
  { id: 'report', label: 'Report' },
]

// ---------------------------------------------------------------------------
// Property input method (Generate Appraisal — step 1)
// ---------------------------------------------------------------------------

export type PropertyInputMethodIconKey = 'address' | 'search' | 'upload'

export type PropertyInputMethodOption = {
  id: string
  title: string
  description: string
  iconKey: PropertyInputMethodIconKey
}

export const PROPERTY_INPUT_METHODS: PropertyInputMethodOption[] = [
  {
    id: 'enter-address',
    title: 'Enter Address',
    description: 'Type the full property address',
    iconKey: 'address',
  },
  {
    id: 'search-property',
    title: 'Search Property',
    description: 'Search our property database',
    iconKey: 'search',
  },
  {
    id: 'upload-file',
    title: 'Upload File',
    description: 'Import from CSV or spreadsheet',
    iconKey: 'upload',
  },
]

export const PROPERTY_TYPE_OPTIONS = ['House', 'Unit', 'Townhouse'] as const

// ---------------------------------------------------------------------------
// AI Property Analysis (Generate Appraisal — step 2)
// ---------------------------------------------------------------------------

export type AiAnalysisMetricTone = 'blue' | 'teal' | 'orange' | 'sky'

export type AiAnalysisMetric = {
  id: string
  label: string
  value: number
  tone: AiAnalysisMetricTone
}

export const MOCK_AI_ANALYSIS_METRICS: AiAnalysisMetric[] = [
  { id: 'location-quality', label: 'Location Quality', value: 92, tone: 'blue' },
  { id: 'property-condition', label: 'Property Condition', value: 85, tone: 'teal' },
  { id: 'market-demand', label: 'Market Demand', value: 88, tone: 'orange' },
  { id: 'growth-potential', label: 'Growth Potential', value: 78, tone: 'sky' },
]

export type AiAnalysisSummaryNotification = {
  title: string
  message: string
}

const AI_ANALYSIS_SUMMARY: AiAnalysisSummaryNotification = {
  title: 'AI-Generated Summary',
  message:
    'This 3-bedroom house is located in a highly desirable area with strong market fundamentals. The property shows excellent location attributes including proximity to amenities, transport, and quality schools. Current market conditions indicate steady demand with moderate growth potential.',
}

export function getAiAnalysisSummaryNotification(): AiAnalysisSummaryNotification {
  return AI_ANALYSIS_SUMMARY
}

// ---------------------------------------------------------------------------
// Comparable Sales (Generate Appraisal — step 3)
// ---------------------------------------------------------------------------

export type ComparableSale = {
  id: string
  address: string
  price: number
  soldAgo: string
  beds: number
  baths: number
  parking: number
  areaSqm: number
  matchPercent: number
  distanceKm: number
}

export const MOCK_COMPARABLE_SALES: ComparableSale[] = [
  {
    id: 'comp-smith-st',
    address: '125 Smith Street, Melbourne VIC',
    price: 840000,
    soldAgo: '2 weeks ago',
    beds: 3,
    baths: 2,
    parking: 2,
    areaSqm: 450,
    matchPercent: 95,
    distanceKm: 0.2,
  },
  {
    id: 'comp-collins-ave',
    address: '89 Collins Avenue, Melbourne VIC',
    price: 825000,
    soldAgo: '1 month ago',
    beds: 3,
    baths: 2,
    parking: 1,
    areaSqm: 420,
    matchPercent: 88,
    distanceKm: 0.5,
  },
  {
    id: 'comp-park-st',
    address: '234 Park Street, Melbourne VIC',
    price: 865000,
    soldAgo: '3 weeks ago',
    beds: 4,
    baths: 2,
    parking: 2,
    areaSqm: 480,
    matchPercent: 82,
    distanceKm: 0.8,
  },
]

// ---------------------------------------------------------------------------
// Market Intelligence (Generate Appraisal — step 4)
// ---------------------------------------------------------------------------

export type SuburbOverviewMetric = {
  id: string
  label: string
  value: string
  tone?: 'positive' | 'default'
}

export const MOCK_SUBURB_OVERVIEW: SuburbOverviewMetric[] = [
  { id: 'median-price', label: 'Median House Price', value: '$845,000' },
  { id: 'growth-12m', label: '12-Month Growth', value: '+8.5%', tone: 'positive' },
  { id: 'rental-yield', label: 'Rental Yield', value: '3.8%' },
  { id: 'days-on-market', label: 'Days on Market', value: '28 days' },
]

export type DemandSignalTone = 'high' | 'medium' | 'strong'

export type DemandSignal = {
  id: string
  label: string
  level: string
  percent: number
  tone: DemandSignalTone
}

export const MOCK_DEMAND_SIGNALS: DemandSignal[] = [
  { id: 'buyer-interest', label: 'Buyer Interest', level: 'High', percent: 100, tone: 'high' },
  { id: 'supply-level', label: 'Supply Level', level: 'Medium', percent: 50, tone: 'medium' },
  { id: 'price-growth', label: 'Price Growth', level: 'Strong', percent: 85, tone: 'strong' },
]

// ---------------------------------------------------------------------------
// Report Configuration (Generate Appraisal — step 5)
// ---------------------------------------------------------------------------

export type ReportTemplateIconKey = 'vendor' | 'bank' | 'buyer' | 'investment'

export type ReportTemplateOption = {
  id: string
  title: string
  description: string
  iconKey: ReportTemplateIconKey
}

export const REPORT_TEMPLATES: ReportTemplateOption[] = [
  {
    id: 'vendor-appraisal',
    title: 'Vendor Appraisal',
    description: 'For sellers listing property',
    iconKey: 'vendor',
  },
  {
    id: 'bank-valuation',
    title: 'Bank Valuation',
    description: 'Formal lending valuation',
    iconKey: 'bank',
  },
  {
    id: 'buyer-advisory',
    title: 'Buyer Advisory',
    description: 'Purchase decision support',
    iconKey: 'buyer',
  },
  {
    id: 'investment-report',
    title: 'Investment Report',
    description: 'ROI and yield analysis',
    iconKey: 'investment',
  },
]
