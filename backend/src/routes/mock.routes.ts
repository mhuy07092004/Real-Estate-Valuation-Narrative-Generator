import { Router } from 'express'

// Backend-served mock dataset for non-auth feature APIs.
export const mockRouter = Router()

type DashboardRole = 'agent' | 'investor' | 'buyer' | 'valuer'

function isDashboardRole(value: string): value is DashboardRole {
  return value === 'agent' || value === 'investor' || value === 'buyer' || value === 'valuer'
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

// Dashboard/home payloads keyed by role.
const DASHBOARD_DATA: Record<DashboardRole, unknown> = {
  agent: {
    welcomeSubtitle: '4 pending client reports • 12 active listings',
    stats: [
      { label: 'Generated Reports', value: '24', trend: '+12 this week', tone: 'blue', iconKey: 'document' },
      { label: 'Active Clients', value: '18', trend: '+3 new', tone: 'teal', iconKey: 'users' },
      { label: 'Avg Appraisal', value: '$875k', trend: '+8% vs. last month', tone: 'orange', iconKey: 'trend' },
      { label: 'Pending Reports', value: '4', trend: '2 due today', tone: 'sky', iconKey: 'clock' },
    ],
    reports: [
      { id: '1', title: 'Vendor Appraisal - Smith St', detail: '$850,000 • Completed & Sent', timeAgo: '2 hours ago' },
      { id: '2', title: 'Buyer Advisory - Harbour View', detail: '$1,250,000 • In Review', timeAgo: '5 hours ago' },
    ],
    insights: [
      { id: '1', title: 'Client Follow-up Due', description: 'Sarah Thompson - Vendor appraisal', badge: 'Action Required', tone: 'teal' },
      { id: '2', title: 'Suburb Price Movement', description: 'Bondi median up 3.2% this quarter', badge: 'Market Update', tone: 'orange' },
    ],
    quickActions: [
      { id: '1', title: 'Generate Appraisal', subtitle: 'Create new report', tone: 'blue', iconKey: 'sparkle' },
      { id: '2', title: 'Client Reports', subtitle: 'View all reports', tone: 'teal', iconKey: 'document' },
    ],
  },
  investor: {
    welcomeSubtitle: '2 portfolios tracked • 5 ROI scenarios saved',
    stats: [
      { label: 'Tracked Assets', value: '11', trend: '+2 this month', tone: 'blue', iconKey: 'document' },
      { label: 'Avg Yield', value: '4.8%', trend: '+0.3% vs. last qtr', tone: 'teal', iconKey: 'trend' },
      { label: 'Open Scenarios', value: '5', trend: '2 need refresh', tone: 'orange', iconKey: 'users' },
      { label: 'Watchlist', value: '9', trend: '3 price alerts', tone: 'sky', iconKey: 'clock' },
    ],
    reports: [
      { id: '1', title: 'Investor Report - Parramatta Unit', detail: '$620,000 • Draft', timeAgo: '3 hours ago' },
      { id: '2', title: 'Market Comparison - Inner West', detail: '$540,000 • Completed', timeAgo: 'Yesterday' },
    ],
    insights: [
      { id: '1', title: 'Yield Opportunity', description: 'Ashfield median rent up 2.4%', badge: 'Market Update', tone: 'orange' },
      { id: '2', title: 'Scenario Expiring', description: 'Parramatta cash-flow model is 30 days old', badge: 'Update', tone: 'blue' },
    ],
    quickActions: [
      { id: '1', title: 'Generate Report', subtitle: 'Investor pack', tone: 'blue', iconKey: 'sparkle' },
      { id: '2', title: 'ROI Calculator', subtitle: 'Model returns', tone: 'teal', iconKey: 'document' },
    ],
  },
  buyer: {
    welcomeSubtitle: '6 shortlisted homes • 2 affordability checks pending',
    stats: [
      { label: 'Shortlist', value: '6', trend: '+1 this week', tone: 'blue', iconKey: 'document' },
      { label: 'Budget Cap', value: '$1.1m', trend: 'Within range', tone: 'teal', iconKey: 'trend' },
      { label: 'Suburb Matches', value: '4', trend: 'Based on prefs', tone: 'orange', iconKey: 'users' },
      { label: 'Pending Checks', value: '2', trend: 'Affordability', tone: 'sky', iconKey: 'clock' },
    ],
    reports: [
      { id: '1', title: 'Buyer Report - Marrickville', detail: '$980,000 • In Review', timeAgo: '4 hours ago' },
      { id: '2', title: 'Affordability Check - Dulwich Hill', detail: '$920,000 • Saved', timeAgo: 'Yesterday' },
    ],
    insights: [
      { id: '1', title: 'Open Home Reminder', description: 'Marrickville inspection this Saturday', badge: 'Action Required', tone: 'teal' },
      { id: '2', title: 'Suburb Explorer Tip', description: 'Similar stock listed in Newtown', badge: 'Update', tone: 'blue' },
    ],
    quickActions: [
      { id: '1', title: 'Search Property', subtitle: 'Browse listings', tone: 'blue', iconKey: 'sparkle' },
      { id: '2', title: 'Affordability', subtitle: 'Run calculator', tone: 'teal', iconKey: 'document' },
    ],
  },
  valuer: {
    welcomeSubtitle: '3 open valuation cases • 8 evidence packs ready',
    stats: [
      { label: 'Open Cases', value: '3', trend: '1 due today', tone: 'blue', iconKey: 'document' },
      { label: 'Evidence Items', value: '42', trend: '+6 this week', tone: 'teal', iconKey: 'users' },
      { label: 'Avg Valuation', value: '$920k', trend: '+4% vs. last month', tone: 'orange', iconKey: 'trend' },
      { label: 'Pending Reviews', value: '2', trend: 'Awaiting peer check', tone: 'sky', iconKey: 'clock' },
    ],
    reports: [
      { id: '1', title: 'Valuation Case - Riverview Rd', detail: '$1,050,000 • In Progress', timeAgo: '1 hour ago' },
      { id: '2', title: 'Evidence Pack - Westmead', detail: '$890,000 • Ready', timeAgo: 'Yesterday' },
    ],
    insights: [
      { id: '1', title: 'Peer Review Requested', description: 'Riverview Rd draft needs second opinion', badge: 'Action Required', tone: 'teal' },
      { id: '2', title: 'Comparable Alert', description: 'New sale within 400m of open case', badge: 'Market Update', tone: 'orange' },
    ],
    quickActions: [
      { id: '1', title: 'Generate Appraisal', subtitle: 'Start valuation', tone: 'blue', iconKey: 'sparkle' },
      { id: '2', title: 'Evidence Center', subtitle: 'Browse comps', tone: 'teal', iconKey: 'document' },
    ],
  },
}

// Role-specific mock collections.
const AGENT_CLIENTS = [
  {
    id: 'CL-1001',
    name: 'Sarah Mitchell',
    initials: 'SM',
    isStarred: false,
    address: '45 Park Ave, Richmond VIC',
    reportCount: 1,
    status: 'appraisal_sent',
    followUpAt: daysAgo(-1),
  },
  {
    id: 'CL-1002',
    name: 'David Park',
    initials: 'DP',
    isStarred: true,
    address: '12 Church St, Fitzroy VIC',
    reportCount: 2,
    status: 'active',
    followUpAt: daysAgo(-2),
  },
]

const AGENT_REPORTS = [
  {
    id: 'AG-3021',
    address: '22 Bridge Rd',
    suburb: 'Richmond VIC 3121',
    clientName: 'Sarah Mitchell',
    status: 'exported',
    purpose: 'Pre-Listing Appraisal',
    confidence: 92,
    updatedAt: hoursAgo(2),
    hasWarning: false,
  },
  {
    id: 'AG-3020',
    address: '5 Oxford St',
    suburb: 'Fitzroy VIC 3065',
    clientName: 'James Nguyen',
    status: 'draft',
    purpose: 'Sale Appraisal',
    confidence: null,
    updatedAt: daysAgo(1),
    hasWarning: false,
  },
]

const INVESTOR_REPORTS = [
  {
    id: 'IN-4102',
    propertyName: '9 Riverside Dr',
    suburb: 'Southbank VIC 3006',
    portfolio: 'Melbourne Core',
    reportType: 'Investment Analysis',
    status: 'shared',
    purchaseValue: 620000,
    grossYield: 4.8,
    updatedAt: hoursAgo(5),
  },
  {
    id: 'IN-4101',
    propertyName: '61 Beach Rd',
    suburb: 'St Kilda VIC 3182',
    portfolio: 'Melbourne Core',
    reportType: 'Yield Assessment',
    status: 'draft',
    purchaseValue: 540000,
    grossYield: null,
    updatedAt: daysAgo(2),
  },
]

const BUYER_REPORTS = [
  {
    id: 'BY-5210',
    address: '3 Grove St',
    suburb: 'Camberwell VIC 3124',
    clientName: 'Self',
    status: 'exported',
    purpose: 'Pre-Purchase Report',
    confidence: 88,
    updatedAt: hoursAgo(6),
    hasWarning: false,
  },
]

const VALUER_CASES = [
  {
    id: 'VC-2047',
    address: '12 Church St',
    suburb: 'Richmond VIC 3121',
    clientName: 'ANZ Bank',
    status: 'valuer_review',
    purpose: 'Market Valuation',
    confidence: 91,
    updatedAt: hoursAgo(1),
    hasWarning: false,
  },
  {
    id: 'VC-2046',
    address: '45 Park Ave',
    suburb: 'Fitzroy VIC 3065',
    clientName: 'Commonwealth Bank',
    status: 'evidence_collection',
    purpose: 'Lending Support',
    confidence: 74,
    updatedAt: hoursAgo(3),
    hasWarning: true,
  },
]

const INBOX_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'AI Update Ready',
    description: 'Your latest analysis is ready to review.',
    priority: 'high',
    timestamp: '20 mins ago',
    isRead: false,
    icon: 'ai',
  },
  {
    id: 'notif-2',
    title: 'Market Alert',
    description: 'New comparable sale added near your tracked property.',
    priority: 'medium',
    timestamp: '3 hours ago',
    isRead: false,
    icon: 'market',
  },
  {
    id: 'notif-3',
    title: 'Report Archived',
    description: 'A completed report was archived successfully.',
    priority: 'low',
    timestamp: '1 day ago',
    isRead: true,
    icon: 'report',
  },
]

const PROPERTY_LIST = [
  {
    id: 'prop-1',
    address: { street: '45 Clarendon St', suburb: 'South Melbourne', state: 'VIC', postcode: '3205' },
    price: 1180000,
    estimatedRange: { min: '$1.09M', max: '$1.21M' },
    propertyType: 'House',
    features: { beds: 3, baths: 2, areaSqm: 312, parking: 2 },
    listedDays: 8,
    status: 'within_range',
  },
  {
    id: 'prop-2',
    address: { street: '12 Park St', suburb: 'South Melbourne', state: 'VIC', postcode: '3205' },
    price: 920000,
    estimatedRange: { min: '$890k', max: '$960k' },
    propertyType: 'Unit',
    features: { beds: 2, baths: 1, areaSqm: 98 },
    listedDays: 14,
    status: 'below_range',
  },
]

const EVIDENCE_LIST = [
  {
    id: 'EV-3012',
    title: '18 Church St sale',
    detail: 'Richmond VIC 3121 · 3 bed / 2 bath',
    category: 'comparable',
    source: 'CoreLogic',
    status: 'verified',
    confidence: 92,
    updatedAt: hoursAgo(2),
  },
  {
    id: 'EV-3009',
    title: 'Inner East median trend',
    detail: 'Q2 2026 suburb price movement +2.4%',
    category: 'market',
    source: 'ABS Housing',
    status: 'verified',
    confidence: 85,
    updatedAt: daysAgo(1),
  },
  {
    id: 'EV-3000',
    title: 'Flood overlay certificate',
    detail: 'Required for lending support purpose',
    category: 'missing',
    source: 'System check',
    status: 'missing',
    confidence: null,
    updatedAt: hoursAgo(3),
  },
]

// Route groups intentionally mirror frontend service paths.
mockRouter.get('/dashboard/:role', (req, res) => {
  const role = req.params.role

  if (!isDashboardRole(role)) {
    res.status(404).json({ message: `Unknown dashboard role: ${role}` })
    return
  }

  res.json(DASHBOARD_DATA[role])
})

mockRouter.get('/agent/clients', (_req, res) => {
  res.json(AGENT_CLIENTS)
})

mockRouter.get('/agent/clients/summary', (_req, res) => {
  res.json({
    totalClients: AGENT_CLIENTS.length,
    followUpsDueSoon: AGENT_CLIENTS.length,
  })
})

mockRouter.get('/agent/reports', (_req, res) => {
  res.json(AGENT_REPORTS)
})

mockRouter.get('/agent/notifications', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS)
})

mockRouter.get('/agent/notifications/unread-count', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS.filter((item) => !item.isRead).length)
})

mockRouter.get('/investor/roi-calculation', (_req, res) => {
  res.json({
    annualSummary: [
      { label: 'Annual Rental Income', amount: 50000, tone: 'green' },
      { label: 'Annual Mortgage Repayments', amount: -2000, tone: 'navy' },
      { label: 'Annual Operating Expenses', amount: -45000, tone: 'navy' },
      { label: 'Management Fees', amount: -5000, tone: 'navy' },
      { label: 'Net Annual Cash-Flow', amount: -52000, tone: 'net' },
    ],
    metrics: [
      { label: 'Loan Amount', value: '$300,000', trend: 'monthly payment: $25,000', tone: 'blue' },
      { label: 'Break-even Rent', value: '$1,165', trend: 'current: $650/wk', tone: 'teal' },
    ],
    investmentReturns: [
      { label: 'Gross Yield', display: '4.0%', tone: 'green' },
      { label: 'Net Yield', display: '2.6%', tone: 'navy' },
      { label: 'Monthly Cash-Flow', display: '$2,341/mth', tone: 'red' },
      { label: 'Cash-on-Cash Returns', display: '-16.5%', tone: 'red' },
    ],
  })
})

mockRouter.get('/investor/reports', (_req, res) => {
  res.json(INVESTOR_REPORTS)
})

mockRouter.get('/investor/reports/summary', (_req, res) => {
  res.json({
    totalReports: INVESTOR_REPORTS.length,
    draftCount: INVESTOR_REPORTS.filter((item) => item.status === 'draft').length,
    sharedCount: INVESTOR_REPORTS.filter((item) => item.status === 'shared').length,
  })
})

mockRouter.get('/investor/notifications', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS)
})

mockRouter.get('/investor/notifications/unread-count', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS.filter((item) => !item.isRead).length)
})

mockRouter.get('/buyer/affordability-calculation', (_req, res) => {
  res.json({
    annualSummary: [
      { label: 'Annual Rental Income', amount: 42000, tone: 'green' },
      { label: 'Annual Mortgage Repayments', amount: -28000, tone: 'navy' },
      { label: 'Annual Operating Expenses', amount: -8500, tone: 'navy' },
      { label: 'Management Fees', amount: -3200, tone: 'navy' },
      { label: 'Net Annual Cash-Flow', amount: 2300, tone: 'net' },
    ],
    metrics: [
      { label: 'Loan Amount', value: '$550,000', trend: 'monthly payment: $3,200', tone: 'blue' },
      { label: 'Break-even Rent', value: '$820', trend: 'current: $750/wk', tone: 'teal' },
    ],
    investmentReturns: [
      { label: 'Gross Yield', display: '5.2%', tone: 'green' },
      { label: 'Net Yield', display: '3.1%', tone: 'navy' },
      { label: 'Monthly Cash-Flow', display: '$192/mth', tone: 'green' },
      { label: 'Cash-on-Cash Returns', display: '1.8%', tone: 'navy' },
    ],
  })
})

mockRouter.get('/buyer/properties/search', (_req, res) => {
  res.json(PROPERTY_LIST)
})

mockRouter.get('/buyer/properties/saved', (_req, res) => {
  res.json(PROPERTY_LIST.slice(0, 1))
})

mockRouter.get('/buyer/reports', (_req, res) => {
  res.json(BUYER_REPORTS)
})

mockRouter.get('/buyer/notifications', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS)
})

mockRouter.get('/buyer/notifications/unread-count', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS.filter((item) => !item.isRead).length)
})

mockRouter.get('/valuer/evidence', (_req, res) => {
  res.json(EVIDENCE_LIST)
})

mockRouter.get('/valuer/evidence/summary', (_req, res) => {
  const comparable = EVIDENCE_LIST.filter((item) => item.category === 'comparable').length
  const market = EVIDENCE_LIST.filter((item) => item.category === 'market').length
  const missing = EVIDENCE_LIST.filter((item) => item.category === 'missing').length

  res.json({
    totalItems: EVIDENCE_LIST.length,
    missingCount: missing,
    stats: [
      { label: 'Comparable Sales', value: String(comparable), tone: 'blue' },
      { label: 'Market Sources', value: String(market), tone: 'teal' },
      { label: 'Missing Evidence', value: String(missing), tone: 'orange' },
    ],
  })
})

mockRouter.get('/valuer/cases', (_req, res) => {
  res.json(VALUER_CASES)
})

mockRouter.get('/valuer/cases/summary', (_req, res) => {
  res.json({
    totalCases: 28,
    returnedForRevision: 3,
    stats: [
      { label: 'In Review', value: '7', tone: 'blue' },
      { label: 'Low Confidence', value: '4', tone: 'orange' },
      { label: 'Awaiting Approval', value: '5', tone: 'sky' },
      { label: 'Approved this month', value: '12', tone: 'teal' },
    ],
  })
})

mockRouter.get('/valuer/notifications', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS)
})

mockRouter.get('/valuer/notifications/unread-count', (_req, res) => {
  res.json(INBOX_NOTIFICATIONS.filter((item) => !item.isRead).length)
})

mockRouter.get('/notifications/roi-disclaimer', (_req, res) => {
  res.json({
    message:
      'MOCK ONLY! - These calculations are estimates for indicative purposes only. They do not constitute financial advice.',
  })
})

mockRouter.get('/notifications/affordability-disclaimer', (_req, res) => {
  res.json({
    message:
      'MOCK ONLY! - These affordability figures are estimates for indicative purposes only. They do not constitute financial or lending advice.',
  })
})

mockRouter.get('/copilot/conversations', (_req, res) => {
  res.json([
    {
      id: 'conv-richmond',
      title: 'Richmond Market Analysis',
      timestamp: 'Today',
      snippet: 'Analysed growth trends and comparable sales…',
      pinned: true,
      active: true,
    },
  ])
})

mockRouter.get('/copilot/suggestions', (_req, res) => {
  res.json([
    { id: 'sug-1', label: 'What are the market trends in Richmond VIC?', icon: 'chart' },
    { id: 'sug-2', label: 'Explain this AI valuation for 123 Smith St', icon: 'building' },
    { id: 'sug-3', label: 'Compare Surry Hills and Newtown for investment', icon: 'compare' },
    { id: 'sug-4', label: 'Rewrite my appraisal report in formal tone', icon: 'document' },
  ])
})

mockRouter.get('/copilot/messages', (_req, res) => {
  res.json([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        "Hello! I'm your Relaive AI Copilot. I can help you analyse properties, understand market trends, explain valuations, and draft professional reports. What would you like to explore today?",
    },
  ])
})

mockRouter.get('/appraisal/steps', (_req, res) => {
  res.json([
    { id: 'property-input', label: 'Property Input' },
    { id: 'ai-analysis', label: 'AI Analysis' },
    { id: 'comparables', label: 'Comparables' },
    { id: 'market-intelligence', label: 'Market Intelligence' },
    { id: 'report', label: 'Report' },
  ])
})

mockRouter.get('/appraisal/property-input-methods', (_req, res) => {
  res.json([
    { id: 'enter-address', title: 'Enter Address', description: 'Type the full property address', iconKey: 'address' },
    { id: 'search-property', title: 'Search Property', description: 'Search our property database', iconKey: 'search' },
    { id: 'upload-file', title: 'Upload File', description: 'Import from CSV or spreadsheet', iconKey: 'upload' },
  ])
})

mockRouter.get('/appraisal/property-types', (_req, res) => {
  res.json(['House', 'Unit', 'Townhouse'])
})

mockRouter.get('/appraisal/ai-analysis-metrics', (_req, res) => {
  res.json([
    { id: 'location-quality', label: 'Location Quality', value: 92, tone: 'blue' },
    { id: 'property-condition', label: 'Property Condition', value: 85, tone: 'teal' },
    { id: 'market-demand', label: 'Market Demand', value: 88, tone: 'orange' },
    { id: 'growth-potential', label: 'Growth Potential', value: 78, tone: 'sky' },
  ])
})

mockRouter.get('/appraisal/ai-analysis-summary', (_req, res) => {
  res.json({
    title: 'AI-Generated Summary',
    message:
      'This 3-bedroom house is located in a highly desirable area with strong market fundamentals and steady demand.',
  })
})

mockRouter.get('/appraisal/comparable-sales', (_req, res) => {
  res.json([
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
  ])
})

mockRouter.get('/appraisal/suburb-overview', (_req, res) => {
  res.json([
    { id: 'median-price', label: 'Median House Price', value: '$845,000' },
    { id: 'growth-12m', label: '12-Month Growth', value: '+8.5%', tone: 'positive' },
    { id: 'rental-yield', label: 'Rental Yield', value: '3.8%' },
    { id: 'days-on-market', label: 'Days on Market', value: '28 days' },
  ])
})

mockRouter.get('/appraisal/demand-signals', (_req, res) => {
  res.json([
    { id: 'buyer-interest', label: 'Buyer Interest', level: 'High', percent: 100, tone: 'high' },
    { id: 'supply-level', label: 'Supply Level', level: 'Medium', percent: 50, tone: 'medium' },
    { id: 'price-growth', label: 'Price Growth', level: 'Strong', percent: 85, tone: 'strong' },
  ])
})

mockRouter.get('/appraisal/report-templates', (_req, res) => {
  res.json([
    { id: 'vendor-appraisal', title: 'Vendor Appraisal', description: 'For sellers listing property', iconKey: 'vendor' },
    { id: 'bank-valuation', title: 'Bank Valuation', description: 'Formal lending valuation', iconKey: 'bank' },
    { id: 'buyer-advisory', title: 'Buyer Advisory', description: 'Purchase decision support', iconKey: 'buyer' },
    { id: 'investment-report', title: 'Investment Report', description: 'ROI and yield analysis', iconKey: 'investment' },
  ])
})
