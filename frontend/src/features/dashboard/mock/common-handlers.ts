import { http, HttpResponse } from 'msw'
import type {
  AiAnalysisSummaryNotification,
  ComparableSale,
  CopilotConversation,
  CopilotMessage,
  CopilotSuggestion,
  DemandSignal,
  NotificationMock,
  PropertyInputMethodOption,
  ReportTemplateOption,
  StepperStep,
  SuburbOverviewMetric,
} from '../../../services/common'
import { simulateLatency } from './mock-utils'

const ROI_DISCLAIMER: NotificationMock = {
  message:
    'MOCK ONLY! - These calculations are estimates for indicative purposes only. They do not constitute financial advice. Consult a qualified financial adviser before making investment decisions.',
}

const AFFORDABILITY_DISCLAIMER: NotificationMock = {
  message:
    'MOCK ONLY! - These affordability figures are estimates for indicative purposes only. They do not constitute financial or lending advice. Confirm borrowing capacity with your lender before making purchase decisions.',
}

const COPILOT_CONVERSATIONS_DATA: CopilotConversation[] = [
  {
    id: 'conv-richmond',
    title: 'Richmond Market Analysis',
    timestamp: 'Today',
    snippet: 'Analysed growth trends and comparable sales…',
    pinned: true,
    active: true,
  },
]

const COPILOT_SUGGESTIONS_DATA: CopilotSuggestion[] = [
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

const COPILOT_MESSAGES_DATA: CopilotMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      "Hello! I'm your Relaive AI Copilot. I can help you analyse properties, understand market trends, explain valuations, and draft professional reports. What would you like to explore today?",
  },
]

const APPRAISAL_STEPS_DATA: StepperStep[] = [
  { id: 'property-input', label: 'Property Input' },
  { id: 'comparables', label: 'Comparables' },
  { id: 'market-intelligence', label: 'Market Intelligence' },
  { id: 'report', label: 'Report' },
]

const PROPERTY_INPUT_METHODS_DATA: PropertyInputMethodOption[] = [
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

const PROPERTY_TYPE_OPTIONS_DATA = ['House', 'Unit', 'Townhouse'] as const

const AI_ANALYSIS_SUMMARY: AiAnalysisSummaryNotification = {
  title: 'AI-Generated Summary',
  message:
    'This 3-bedroom house is located in a highly desirable area with strong market fundamentals. The property shows excellent location attributes including proximity to amenities, transport, and quality schools. Current market conditions indicate steady demand with moderate growth potential.',
}

const COMPARABLE_SALES_DATA: ComparableSale[] = [
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

const SUBURB_OVERVIEW_DATA: SuburbOverviewMetric[] = [
  { id: 'median-price', label: 'Median House Price', value: '$845,000' },
  { id: 'growth-12m', label: '12-Month Growth', value: '+8.5%', tone: 'positive' },
  { id: 'rental-yield', label: 'Rental Yield', value: '3.8%' },
  { id: 'days-on-market', label: 'Days on Market', value: '28 days' },
]

const DEMAND_SIGNALS_DATA: DemandSignal[] = [
  { id: 'buyer-interest', label: 'Buyer Interest', level: 'High', percent: 100, tone: 'high' },
  { id: 'supply-level', label: 'Supply Level', level: 'Medium', percent: 50, tone: 'medium' },
  { id: 'price-growth', label: 'Price Growth', level: 'Strong', percent: 85, tone: 'strong' },
]

const REPORT_TEMPLATES_DATA: ReportTemplateOption[] = [
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

export const commonHandlers = [
  http.get('/api/notifications/roi-disclaimer', async () => {
    await simulateLatency()
    return HttpResponse.json(ROI_DISCLAIMER)
  }),

  http.get('/api/notifications/affordability-disclaimer', async () => {
    await simulateLatency()
    return HttpResponse.json(AFFORDABILITY_DISCLAIMER)
  }),

  http.get('/api/copilot/conversations', async () => {
    await simulateLatency()
    return HttpResponse.json(COPILOT_CONVERSATIONS_DATA)
  }),

  http.get('/api/copilot/suggestions', async () => {
    await simulateLatency()
    return HttpResponse.json(COPILOT_SUGGESTIONS_DATA)
  }),

  http.get('/api/copilot/messages', async () => {
    await simulateLatency()
    return HttpResponse.json(COPILOT_MESSAGES_DATA)
  }),

  http.get('/api/appraisal/steps', async () => {
    await simulateLatency()
    return HttpResponse.json(APPRAISAL_STEPS_DATA)
  }),

  http.get('/api/appraisal/property-input-methods', async () => {
    await simulateLatency()
    return HttpResponse.json(PROPERTY_INPUT_METHODS_DATA)
  }),

  http.get('/api/appraisal/property-types', async () => {
    await simulateLatency()
    return HttpResponse.json(PROPERTY_TYPE_OPTIONS_DATA)
  }),

  http.get('/api/appraisal/ai-analysis-summary', async () => {
    await simulateLatency()
    return HttpResponse.json(AI_ANALYSIS_SUMMARY)
  }),

  http.get('/api/appraisal/comparable-sales', async () => {
    await simulateLatency()
    return HttpResponse.json(COMPARABLE_SALES_DATA)
  }),

  http.get('/api/appraisal/suburb-overview', async () => {
    await simulateLatency()
    return HttpResponse.json(SUBURB_OVERVIEW_DATA)
  }),

  http.get('/api/appraisal/demand-signals', async () => {
    await simulateLatency()
    return HttpResponse.json(DEMAND_SIGNALS_DATA)
  }),

  http.get('/api/appraisal/report-templates', async () => {
    await simulateLatency()
    return HttpResponse.json(REPORT_TEMPLATES_DATA)
  }),
]
