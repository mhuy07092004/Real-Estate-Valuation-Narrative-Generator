import { http, HttpResponse } from 'msw'
import type {
  AgentRecommendations,
  AiAnalysisSummaryNotification,
  AppraisalDisclaimer,
  AppraisalSummary,
  ComparableSale,
  CopilotConversation,
  CopilotMessage,
  CopilotSuggestion,
  DemandSignal,
  ExecutiveSummary,
  NarrativePreview,
  NotificationMock,
  PropertyInputMethodOption,
  PropertySpecificFactors,
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

const NARRATIVE_PREVIEW_DATA: NarrativePreview = {
  title: 'AI-Generated Narrative Preview',
  sections: [
    {
      heading: 'Executive Summary:',
      body: 'This 3-bedroom house at 123 represents a solid investment opportunity in a growing market. Our AI-powered analysis indicates a current market value of $850,000 with strong confidence based on recent comparable sales and market conditions.',
    },
    {
      heading: 'Property Analysis:',
      body: 'The property demonstrates excellent location attributes with high scores for amenity access, transport connectivity, and school quality. The property size aligns well with market expectations for this type of dwelling...',
    },
  ],
  disclaimer:
    'Full report will include comprehensive analysis, comparable sales evidence, market intelligence, and confidence scoring.',
}

const APPRAISAL_SUMMARY_DATA: AppraisalSummary = {
  eyebrow: 'RELAIVE · AGENT APPRAISAL REPORT',
  date: '02/08/2026',
  street: '45 Smith Street',
  suburbLine: 'South Yarra VIC 3141',
  featuresLine: 'House · 3 bed · 2 bath · 430m²',
  appraisalLabel: 'AI-Generated Market Appraisal',
  priceRange: '$1,450,000 – $1,550,000',
  midpointEstimate: 'Midpoint estimate: $1,500,000',
  stats: [
    { id: 'comparables', value: '8', label: 'Comparables' },
    { id: 'clearance-rate', value: '78%', label: 'Clearance Rate' },
    { id: 'days-on-mkt', value: '22 avg', label: 'Days on Mkt' },
    { id: 'annual-growth', value: '+8.2%', label: 'Annual Growth' },
  ],
}

const EXECUTIVE_SUMMARY_DATA: ExecutiveSummary = {
  title: '1. EXECUTIVE SUMMARY',
  paragraphs: [
    [
      {
        text: "This well-presented three-bedroom residence is positioned in South Yarra — one of Melbourne's most consistently performing inner-city suburbs. The property presents in excellent condition and benefits from a generous 430m² land holding, providing significant future development potential subject to council approval. The home features an updated kitchen, two bathrooms, a separate laundry, and a north-facing rear garden — attributes strongly favoured by the local buyer demographic of professional families and upsizers.",
      },
    ],
    [
      {
        text: 'Based on a comprehensive analysis of eight comparable sales within a 1.5km radius completed between March and June 2026, the AI valuation model has derived an appraisal range of ',
      },
      {
        text: '$1,450,000 – $1,550,000',
        highlight: true,
      },
      {
        text: ', with a midpoint estimate of $1,500,000. Properties of equivalent specification in this corridor have demonstrated consistent buyer demand, underpinned by an auction clearance rate of 78% and a tightening median days-on-market of 22 days, down from 31 days in the same period last year.',
      },
    ],
    [
      {
        text: "The subject property's land size exceeds the suburb median of 398m², which provides a meaningful premium over comparable sales on smaller allotments. If presented well and marketed during the spring 2026 campaign, this property is positioned to achieve results toward the upper end of the estimated range.",
      },
    ],
  ],
  observationTitle: 'AI Key Observation',
  observationMessage:
    'The primary comparable — 12 Alexandra Ave, South Yarra (sold $1,510,000, June 2026, auction) — is the strongest anchor for this estimate given near-identical land size (412m²), matching bedroom and bathroom configuration, and proximity (0.4km). This sale carries a 28% weighting in the AI valuation model.',
}

const PROPERTY_SPECIFIC_FACTORS_DATA: PropertySpecificFactors = {
  title: '2. PROPERTY-SPECIFIC FACTORS',
  valueAddingTitle: 'VALUE-ADDING FACTORS',
  valueAdding: [
    {
      id: 'land-holding',
      title: 'Superior land holding',
      description: '430m² vs suburb median 398m² — adds est. +$58,000 premium',
    },
    {
      id: 'north-garden',
      title: 'North-facing garden',
      description: 'High-demand orientation; north-facing premium est. +$20,000–$30,000',
    },
    {
      id: 'renovated',
      title: 'Renovated kitchen & bathrooms',
      description: 'Reduces buyer repair risk; broadens buyer pool',
    },
    {
      id: 'period-character',
      title: 'Period character — Edwardian',
      description: 'High ceiling appeal; sought-after in South Yarra',
    },
    {
      id: 'school-catchment',
      title: 'School catchment — South Yarra Primary',
      description: 'Desirable catchment; premium of est. +$15,000–$25,000',
    },
  ],
  riskTitle: 'RISK & LIMITING FACTORS',
  risk: [
    {
      id: 'laneway',
      title: 'Rear laneway access only',
      description:
        'Single car access via laneway — limits a second off-street space; minor sensitivity in family buyer demographic',
    },
    {
      id: 'chapel-st',
      title: 'Chapel St proximity',
      description:
        'Some buyer sensitivity to evening noise and foot traffic; partially offset by café/restaurant amenity premium',
    },
    {
      id: 'heritage',
      title: 'Heritage overlay (HO4)',
      description:
        'Limits structural alterations and extensions without council approval; reduces development upside for some buyers',
    },
    {
      id: 'bathroom',
      title: 'Single-bathroom floor plan (ensuite only)',
      description:
        'Main bathroom doubles as ensuite — a minor compromise vs comparables with dedicated family bathroom',
    },
  ],
}

const AGENT_RECOMMENDATIONS_DATA: AgentRecommendations = {
  title: '3. AGENT RECOMMENDATIONS',
  items: [
    {
      id: 'campaign',
      title: 'Campaign Strategy',
      description:
        'A four-week auction campaign commencing in the first week of September 2026 is recommended to coincide with the spring uplift in buyer activity. Set a buyer price guide of $1,400,000–$1,500,000 to attract the widest possible buyer pool and maximise competitive tension at auction.',
      iconKey: 'campaign',
    },
    {
      id: 'presentation',
      title: 'Presentation Priorities',
      description:
        'Invest in professional styling — estimate $3,500–$5,000. Focus on north-facing garden staging and kitchen presentation. Repaint front facade if not recently done. Highlight the land size and school catchment prominently in all marketing copy.',
      iconKey: 'presentation',
    },
    {
      id: 'marketing',
      title: 'Marketing Channels',
      description:
        'Allocate 60% of marketing budget to digital (REA Premium+, Domain Premiere+), 30% to social media (Instagram/Facebook geo-targeted to Stonnington and Port Phillip postcodes), and 10% to print (local papers). Estimated marketing budget: $8,000–$12,000.',
      iconKey: 'marketing',
      highlighted: true,
    },
  ],
}

const APPRAISAL_DISCLAIMER_DATA: AppraisalDisclaimer = {
  title: 'Disclaimer:',
  message:
    'This report was generated by Relaive AI on 2 August 2026 and is intended as a guidance tool only. It does not constitute a formal property valuation under the Valuers Act 2003 (Vic) and should not be relied upon as such in legal, financial, or lending contexts. All figures are estimates based on publicly available transaction data and AI modelling. Relaive recommends this report be reviewed by a licensed real estate agent or certified practising valuer before being presented to vendors or third parties. Market conditions may change rapidly; this appraisal has a recommended validity period of 90 days from the date of generation.',
  footer: 'Generated by Relaive AI · relaive.com.au · Report ID: RPT-9TH5PRUA',
}

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

  http.get('/api/appraisal/narrative-preview', async () => {
    await simulateLatency()
    return HttpResponse.json(NARRATIVE_PREVIEW_DATA)
  }),

  http.get('/api/appraisal/appraisal-summary', async () => {
    await simulateLatency()
    return HttpResponse.json(APPRAISAL_SUMMARY_DATA)
  }),

  http.get('/api/appraisal/executive-summary', async () => {
    await simulateLatency()
    return HttpResponse.json(EXECUTIVE_SUMMARY_DATA)
  }),

  http.get('/api/appraisal/property-specific-factors', async () => {
    await simulateLatency()
    return HttpResponse.json(PROPERTY_SPECIFIC_FACTORS_DATA)
  }),

  http.get('/api/appraisal/agent-recommendations', async () => {
    await simulateLatency()
    return HttpResponse.json(AGENT_RECOMMENDATIONS_DATA)
  }),

  http.get('/api/appraisal/appraisal-disclaimer', async () => {
    await simulateLatency()
    return HttpResponse.json(APPRAISAL_DISCLAIMER_DATA)
  }),
]
