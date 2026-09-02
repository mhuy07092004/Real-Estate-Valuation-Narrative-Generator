import { Router } from 'express'
import { generateNarrative } from '../services/narrative.service.js'
import { isReportType, REPORT_PROMPTS, type ReportType } from '../services/narrative-prompts.js'

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

type AppraisalInputContext = {
  address: string
  streetNumber: number
  streetName: string
  suburb: string
  state: string
  postcode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  parking: number
  landSizeSqm: number
}

type ComparableSalePayload = {
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

function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function parsePositiveInt(value: unknown): number | null {
  const source = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : ''
  const parsed = Number(source)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.round(parsed)
}

function parseAddress(address: string): {
  streetNumber: number
  streetName: string
  suburb: string
  state: string
  postcode: string
} {
  const fallback = {
    streetNumber: 111,
    streetName: 'Kincumber Road',
    suburb: 'Bonnyrigg',
    state: 'NSW',
    postcode: '2177',
  }

  const match = address
    .trim()
    .match(/^(\d+)\s+([^,]+),\s*([^,]+)\s+([A-Za-z]{2,3})\s+(\d{4})$/)

  if (!match) return fallback

  return {
    streetNumber: Number(match[1]),
    streetName: toTitleCase(match[2]),
    suburb: toTitleCase(match[3]),
    state: match[4].toUpperCase(),
    postcode: match[5],
  }
}

function createAppraisalContext(query: Record<string, unknown>): AppraisalInputContext {
  const addressRaw =
    typeof query.address === 'string' && query.address.trim()
      ? query.address.trim()
      : '111 Kincumber Road, Bonnyrigg NSW 2177'

  const parsed = parseAddress(addressRaw)

  return {
    address: addressRaw,
    streetNumber: parsed.streetNumber,
    streetName: parsed.streetName,
    suburb: parsed.suburb,
    state: parsed.state,
    postcode: parsed.postcode,
    propertyType:
      typeof query.propertyType === 'string' && query.propertyType.trim()
        ? toTitleCase(query.propertyType)
        : 'House',
    bedrooms: parsePositiveInt(query.bedrooms) ?? 3,
    bathrooms: parsePositiveInt(query.bathrooms) ?? 2,
    parking: parsePositiveInt(query.parking) ?? 2,
    landSizeSqm: parsePositiveInt(query.landSizeSqm) ?? 430,
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

function weeksAgoLabel(): string {
  const value = Math.floor(Math.random() * 8) + 2
  return value === 1 ? '1 week ago' : `${value} weeks ago`
}

function computeEstimatedValue(context: AppraisalInputContext): number {
  const propertyTypeMultiplier =
    context.propertyType === 'Unit'
      ? 0.78
      : context.propertyType === 'Townhouse'
        ? 0.9
        : 1

  const areaValue = context.landSizeSqm * 1850
  const roomValue = context.bedrooms * 60000 + context.bathrooms * 35000 + context.parking * 18000
  const base = (areaValue + roomValue + 210000) * propertyTypeMultiplier
  return Math.round(base / 1000) * 1000
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function createComparableSales(context: AppraisalInputContext): ComparableSalePayload[] {
  const baseValue = computeEstimatedValue(context)
  const offsets = [
    { number: -6, beds: -1, baths: 0, parking: 0, area: -35, distance: 0.3, premium: -0.06 },
    { number: 9, beds: 0, baths: 1, parking: 0, area: 20, distance: 0.5, premium: 0.03 },
    { number: 17, beds: 1, baths: 0, parking: 1, area: 45, distance: 0.8, premium: 0.08 },
  ]

  return offsets.map((offset, index) => {
    const beds = clamp(context.bedrooms + offset.beds, 1, 8)
    const baths = clamp(context.bathrooms + offset.baths, 1, 6)
    const parking = clamp(context.parking + offset.parking, 0, 4)
    const areaSqm = clamp(context.landSizeSqm + offset.area, 120, 1500)
    const price = Math.round((baseValue * (1 + offset.premium)) / 1000) * 1000

    return {
      id: `comp-${index + 1}`,
      address: `${Math.max(1, context.streetNumber + offset.number)} ${context.streetName}, ${context.suburb} ${context.state}`,
      price,
      soldAgo: weeksAgoLabel(),
      beds,
      baths,
      parking,
      areaSqm,
      matchPercent: clamp(94 - index * 5, 70, 99),
      distanceKm: offset.distance,
    }
  })
}

function buildAppraisalSnapshot(context: AppraisalInputContext) {
  const midpoint = computeEstimatedValue(context)
  const low = Math.round((midpoint * 0.95) / 5000) * 5000
  const high = Math.round((midpoint * 1.05) / 5000) * 5000
  const comparables = createComparableSales(context)

  return {
    midpoint,
    low,
    high,
    comparables,
    rangeLabel: `${formatCurrency(low)} - ${formatCurrency(high)}`,
    midpointLabel: `Midpoint estimate: ${formatCurrency(midpoint)}`,
  }
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
  // Shape: see ValuerDashboardPayload in frontend/src/services/dashboard.ts
  valuer: {
    stats: [],
    cases: [],
    monthlyProgress: {
      completed: { current: 0, total: 0 },
      inProgress: { current: 0, total: 0 },
    },
    valueDistribution: {
      under800k: 0,
      range800kTo1_2m: 0,
      range1_2mTo2m: 0,
      over2m: 0,
    },
    quickActions: [],
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
    id: 'AG-3028',
    address: '45 Park Ave',
    suburb: 'Richmond VIC 3121',
    clientName: 'Sarah Mitchell',
    status: 'generated',
    estimatedValue: 1430000,
    beds: 3,
    baths: 2,
    areaSqm: 398,
    updatedAt: hoursAgo(3),
  },
  {
    id: 'AG-3027',
    address: '12 Church St',
    suburb: 'Fitzroy VIC 3065',
    clientName: 'David Park',
    status: 'shared',
    estimatedValue: 1180000,
    beds: 2,
    baths: 1,
    areaSqm: 186,
    updatedAt: daysAgo(1),
  },
  {
    id: 'AG-3026',
    address: '88 Brunswick St',
    suburb: 'Fitzroy VIC 3065',
    clientName: 'James & Kathy Wu',
    status: 'generated',
    estimatedValue: 1650000,
    beds: 4,
    baths: 2,
    areaSqm: 512,
    updatedAt: daysAgo(2),
  },
  {
    id: 'AG-3025',
    address: '7 Bridge Rd',
    suburb: 'Richmond VIC 3121',
    clientName: 'Tom Nguyen',
    status: 'generated',
    estimatedValue: 980000,
    beds: 2,
    baths: 1,
    areaSqm: 142,
    updatedAt: daysAgo(3),
  },
  {
    id: 'AG-3024',
    address: '3 Collingwood St',
    suburb: 'Collingwood VIC 3066',
    clientName: 'Emma Chen',
    status: 'shared',
    estimatedValue: 1210000,
    beds: 3,
    baths: 2,
    areaSqm: 274,
    updatedAt: daysAgo(4),
  },
  {
    id: 'AG-3023',
    address: '9 Chapel St',
    suburb: 'Prahran VIC 3181',
    clientName: 'Olivia Brown',
    status: 'generated',
    estimatedValue: 2140000,
    beds: 4,
    baths: 3,
    areaSqm: 620,
    updatedAt: daysAgo(5),
  },
  {
    id: 'AG-3022',
    address: '15 Smith St',
    suburb: 'Collingwood VIC 3066',
    clientName: 'Priya Sharma',
    status: 'generated',
    estimatedValue: 875000,
    beds: 2,
    baths: 1,
    areaSqm: 110,
    updatedAt: daysAgo(7),
  },
  {
    id: 'AG-3021',
    address: '41 High St',
    suburb: 'Prahran VIC 3181',
    clientName: 'Chen Family Trust',
    status: 'shared',
    estimatedValue: 1890000,
    beds: 3,
    baths: 2,
    areaSqm: 445,
    updatedAt: daysAgo(14),
  },
]

const INVESTOR_REPORTS = [
  {
    id: 'IN-4108',
    address: '9 Riverside Dr',
    suburb: 'Southbank VIC 3006',
    clientName: 'Melbourne Core',
    status: 'shared',
    estimatedValue: 1120000,
    beds: 2,
    baths: 2,
    areaSqm: 92,
    updatedAt: hoursAgo(5),
  },
  {
    id: 'IN-4107',
    address: '22 King St',
    suburb: 'Newtown NSW 2042',
    clientName: 'Sydney Satellite',
    status: 'generated',
    estimatedValue: 1050000,
    beds: 2,
    baths: 1,
    areaSqm: 85,
    updatedAt: hoursAgo(8),
  },
  {
    id: 'IN-4106',
    address: '61 Beach Rd',
    suburb: 'St Kilda VIC 3182',
    clientName: 'Melbourne Core',
    status: 'generated',
    estimatedValue: 890000,
    beds: 2,
    baths: 1,
    areaSqm: 78,
    updatedAt: daysAgo(1),
  },
  {
    id: 'IN-4105',
    address: '8 Grove Ave',
    suburb: 'Ashfield NSW 2131',
    clientName: 'Sydney Satellite',
    status: 'generated',
    estimatedValue: 695000,
    beds: 3,
    baths: 1,
    areaSqm: 142,
    updatedAt: daysAgo(2),
  },
  {
    id: 'IN-4104',
    address: '14 Bay St',
    suburb: 'Port Melbourne VIC 3207',
    clientName: 'Growth Portfolio',
    status: 'generated',
    estimatedValue: 1450000,
    beds: 3,
    baths: 2,
    areaSqm: 186,
    updatedAt: daysAgo(4),
  },
  {
    id: 'IN-4103',
    address: '101 Collins St',
    suburb: 'Melbourne VIC 3000',
    clientName: 'Melbourne Core',
    status: 'generated',
    estimatedValue: 720000,
    beds: 1,
    baths: 1,
    areaSqm: 58,
    updatedAt: daysAgo(5),
  },
  {
    id: 'IN-4102',
    address: '44 Punt Rd',
    suburb: 'Richmond VIC 3121',
    clientName: 'Growth Portfolio',
    status: 'generated',
    estimatedValue: 1380000,
    beds: 3,
    baths: 2,
    areaSqm: 210,
    updatedAt: daysAgo(7),
  },
  {
    id: 'IN-4101',
    address: '7 Toorak Rd',
    suburb: 'South Yarra VIC 3141',
    clientName: 'Growth Portfolio',
    status: 'shared',
    estimatedValue: 2450000,
    beds: 4,
    baths: 3,
    areaSqm: 510,
    updatedAt: daysAgo(14),
  },
]

const BUYER_REPORTS = [
  {
    id: 'BY-5216',
    address: '3 Grove St',
    suburb: 'Camberwell VIC 3124',
    clientName: 'Self',
    status: 'generated',
    estimatedValue: 1280000,
    beds: 3,
    baths: 2,
    areaSqm: 312,
    updatedAt: hoursAgo(6),
  },
  {
    id: 'BY-5215',
    address: '18 Bridge Rd',
    suburb: 'Richmond VIC 3121',
    clientName: 'Self',
    status: 'generated',
    estimatedValue: 795000,
    beds: 2,
    baths: 1,
    areaSqm: 110,
    updatedAt: hoursAgo(12),
  },
  {
    id: 'BY-5214',
    address: '27 Toorak Rd',
    suburb: 'Toorak VIC 3142',
    clientName: 'Self',
    status: 'shared',
    estimatedValue: 2100000,
    beds: 4,
    baths: 3,
    areaSqm: 420,
    updatedAt: daysAgo(2),
  },
  {
    id: 'BY-5213',
    address: '9 Swan St',
    suburb: 'Richmond VIC 3121',
    clientName: 'Self',
    status: 'generated',
    estimatedValue: 815000,
    beds: 2,
    baths: 1,
    areaSqm: 98,
    updatedAt: daysAgo(3),
  },
  {
    id: 'BY-5212',
    address: '44 High St',
    suburb: 'Kew VIC 3101',
    clientName: 'Self',
    status: 'generated',
    estimatedValue: 1560000,
    beds: 3,
    baths: 2,
    areaSqm: 280,
    updatedAt: daysAgo(5),
  },
  {
    id: 'BY-5211',
    address: '12 Park St',
    suburb: 'South Melbourne VIC 3205',
    clientName: 'Joint search',
    status: 'shared',
    estimatedValue: 920000,
    beds: 2,
    baths: 1,
    areaSqm: 98,
    updatedAt: daysAgo(6),
  },
  {
    id: 'BY-5210',
    address: '5 Clarendon St',
    suburb: 'South Melbourne VIC 3205',
    clientName: 'Self',
    status: 'generated',
    estimatedValue: 1180000,
    beds: 3,
    baths: 2,
    areaSqm: 312,
    updatedAt: daysAgo(8),
  },
  {
    id: 'BY-5209',
    address: '22 Smith St',
    suburb: 'Fitzroy VIC 3065',
    clientName: 'Self',
    status: 'generated',
    estimatedValue: 1050000,
    beds: 2,
    baths: 1,
    areaSqm: 85,
    updatedAt: daysAgo(12),
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

mockRouter.get('/agent/properties/saved', (_req, res) => {
  res.json([
    {
      id: 'saved-park-ave',
      address: '47 Park Avenue, South Yarra VIC 3141',
      savedAgo: '3 days ago',
      propertyType: 'House',
      beds: 3,
      baths: 2,
      areaSqm: 420,
    },
    {
      id: 'saved-church-st',
      address: '12 Church Street, Richmond VIC 3121',
      savedAgo: '1 week ago',
      propertyType: 'House',
      beds: 4,
      baths: 2,
      areaSqm: 380,
    },
    {
      id: 'saved-swan-st',
      address: '9 Swan Street, Cremorne VIC 3121',
      savedAgo: '2 weeks ago',
      propertyType: 'House',
      beds: 3,
      baths: 1,
      areaSqm: 310,
    },
  ])
})

mockRouter.get('/investor/properties/saved', (_req, res) => {
  res.json([
    {
      id: 'investor-saved-collins',
      address: '101 Collins Street, Melbourne VIC 3000',
      savedAgo: '4 days ago',
      propertyType: 'Apartment',
      beds: 2,
      baths: 2,
      areaSqm: 92,
    },
    {
      id: 'investor-saved-punt',
      address: '44 Punt Road, Richmond VIC 3121',
      savedAgo: '1 week ago',
      propertyType: 'Townhouse',
      beds: 3,
      baths: 2,
      areaSqm: 186,
    },
    {
      id: 'investor-saved-toorak',
      address: '7 Toorak Road, South Yarra VIC 3141',
      savedAgo: '12 days ago',
      propertyType: 'House',
      beds: 4,
      baths: 3,
      areaSqm: 510,
    },
  ])
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
    draftCount: INVESTOR_REPORTS.filter((item) => item.status === 'generated').length,
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
    summary: [
      { label: 'Repayment-to-income', value: '26%', valueTone: 'orange' },
      { label: 'Ideal Range', value: 'below 30%' },
      { label: 'AFFORDABILITY', value: 'Moderate', valueTone: 'orange' },
    ],
    metrics: [
      {
        label: 'Estimate Borrowing Capacity',
        value: '$798,000',
        tone: 'blue',
        valueClassName: 'text-[22px] sm:text-[28px] text-emerald-600',
      },
      {
        label: 'Max Loan Amount',
        value: '$550,000',
        tone: 'blue',
        valueClassName: 'text-[22px] sm:text-[28px] text-amber-500',
      },
      {
        label: 'Monthly Repayment',
        value: '$3,200',
        tone: 'teal',
      },
    ],
  })
})

mockRouter.get('/buyer/properties/search', (_req, res) => {
  res.json(PROPERTY_LIST)
})

mockRouter.get('/buyer/properties/saved', (_req, res) => {
  res.json([
    {
      id: 'buyer-saved-cecil',
      address: '18 Cecil Street, South Melbourne VIC 3205',
      savedAgo: '2 days ago',
      propertyType: 'House',
      beds: 3,
      baths: 2,
      areaSqm: 295,
    },
    {
      id: 'buyer-saved-york',
      address: '9 York Street, South Melbourne VIC 3205',
      savedAgo: '5 days ago',
      propertyType: 'Unit',
      beds: 2,
      baths: 2,
      areaSqm: 110,
    },
    {
      id: 'buyer-saved-coventry',
      address: '3 Coventry Street, Southbank VIC 3006',
      savedAgo: '1 week ago',
      propertyType: 'Apartment',
      beds: 2,
      baths: 1,
      areaSqm: 78,
    },
  ])
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

function daysFromNowAt(days: number, hours: number, minutes: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

mockRouter.get('/buyer/inspections', (_req, res) => {
  res.json([
    {
      id: 'insp-clarendon',
      address: '45 Clarendon St',
      suburb: 'South Melbourne VIC 3205',
      inspectionDate: daysFromNowAt(3, 11, 30),
      agents: ['Sarah Chen'],
      overallNotes: '',
      checklist: [
        {
          id: 'exterior',
          label: 'Exterior & Facade',
          description: 'Rendered walls in good condition, minor hairline cracks near porch.',
          status: 'ok',
        },
        {
          id: 'roof',
          label: 'Roof Condition',
          description: 'Recently re-tiled, no visible wear.',
          status: 'ok',
        },
        {
          id: 'moisture',
          label: 'Moisture & Damp',
          description: 'No damp smell or staining detected.',
          status: 'ok',
        },
        {
          id: 'kitchen',
          label: 'Kitchen',
          description: 'Original but well maintained, appliances dated.',
          status: 'concern',
          estimatedCost: 650,
        },
        {
          id: 'bathrooms',
          label: 'Bathrooms',
          description: 'Clean, regrouted recently.',
          status: 'ok',
        },
        {
          id: 'electrical',
          label: 'Electrical',
          description: 'Switchboard upgraded 2021, compliant.',
          status: 'ok',
        },
        {
          id: 'noise',
          label: 'Noise & Soundproofing',
          description: 'Quiet street, minimal traffic noise.',
          status: 'ok',
        },
        {
          id: 'light',
          label: 'Natural Light',
          description: 'East facing living area, good morning light.',
          status: 'ok',
        },
        {
          id: 'storage',
          label: 'Storage',
          description: 'Built-in robes in both bedrooms.',
          status: 'ok',
        },
        {
          id: 'renovation',
          label: 'Renovation / Repair Needs',
          description: 'No major works needed.',
          status: 'ok',
        },
      ],
    },
    {
      id: 'insp-grey',
      address: '12 Grey St',
      suburb: 'St Kilda VIC 3182',
      inspectionDate: daysFromNowAt(3, 13, 30),
      agents: ['Mark Tran', 'Julia Cheng'],
      overallNotes: '',
      checklist: [
        {
          id: 'exterior',
          label: 'Exterior & Facade',
          description: 'Well-maintained, freshly painted.',
          status: 'ok',
        },
        {
          id: 'roof',
          label: 'Roof Condition',
          description: 'Minor rust on gutters — ask about age.',
          status: 'concern',
          estimatedCost: 800,
        },
        {
          id: 'moisture',
          label: 'Moisture & Damp',
          description: 'Not checked yet.',
          status: 'not_checked',
        },
        {
          id: 'kitchen',
          label: 'Kitchen',
          description: 'Renovated 2022, good condition.',
          status: 'ok',
        },
        {
          id: 'bathrooms',
          label: 'Bathrooms',
          description: 'Single bathroom, well maintained.',
          status: 'ok',
        },
        {
          id: 'electrical',
          label: 'Electrical',
          description: 'Older switchboard — check compliance.',
          status: 'concern',
          estimatedCost: 1500,
        },
        {
          id: 'noise',
          label: 'Noise & Soundproofing',
          description: 'Carpet & road noise clearly audible — high traffic issue.',
          status: 'major_issue',
        },
        {
          id: 'light',
          label: 'Natural Light',
          description: 'North facing living — excellent light.',
          status: 'ok',
        },
        {
          id: 'storage',
          label: 'Storage',
          description: 'Limited built-in storage for size.',
          status: 'ok',
        },
        {
          id: 'renovation',
          label: 'Renovation / Repair Needs',
          description: 'Not checked yet.',
          status: 'not_checked',
        },
      ],
    },
  ])
})

mockRouter.get('/valuer/evidence/saved', (_req, res) => {
  res.json([
    {
      id: 'valuer-saved-gertrude',
      address: '22 Gertrude Street, Fitzroy VIC 3065',
      savedAgo: '1 day ago',
      propertyType: 'Terrace',
      beds: 3,
      baths: 2,
      areaSqm: 248,
    },
    {
      id: 'valuer-saved-chapel',
      address: '8 Chapel Street, Windsor VIC 3181',
      savedAgo: '6 days ago',
      propertyType: 'House',
      beds: 4,
      baths: 2,
      areaSqm: 365,
    },
    {
      id: 'valuer-saved-high',
      address: '15 High Street, Kew VIC 3101',
      savedAgo: '2 weeks ago',
      propertyType: 'House',
      beds: 5,
      baths: 3,
      areaSqm: 620,
    },
  ])
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

mockRouter.get('/appraisal/steps', (req, res) => {
  const role = typeof req.query.role === 'string' ? req.query.role : undefined

  if (role === 'investor') {
    res.json([
      { id: 'property-details', label: 'Property Details' },
      { id: 'comparable-sales', label: 'Comparable Sales' },
      { id: 'market-intelligence', label: 'Market Intelligence' },
      { id: 'roi-analysis', label: 'ROI Analysis' },
      { id: 'report-type', label: 'Report Type' },
      { id: 'generated-report', label: 'Generated Report' },
    ])
    return
  }

  if (role === 'buyer') {
    res.json([
      { id: 'property-details', label: 'Property Details' },
      { id: 'comparable-sales', label: 'Comparable Sales' },
      { id: 'market-intelligence', label: 'Market Intelligence' },
      { id: 'affordability', label: 'Affordability' },
      { id: 'report-type', label: 'Report Type' },
      { id: 'generated-report', label: 'Generated Report' },
    ])
    return
  }

  res.json([
    { id: 'property-details', label: 'Property Details' },
    { id: 'comparable-sales', label: 'Comparable Sales' },
    { id: 'market-intelligence', label: 'Market Intelligence' },
    { id: 'report-type', label: 'Report Type' },
    { id: 'generated-report', label: 'Generated Report' },
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
  res.json(['House', 'Townhouse', 'Unit', 'Apartment', 'Villa'])
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

mockRouter.get('/appraisal/comparable-sales', (req, res) => {
  const context = createAppraisalContext(req.query as Record<string, unknown>)
  const snapshot = buildAppraisalSnapshot(context)
  res.json(snapshot.comparables)
})

const KNOWN_PROPERTY_ADDRESSES = [
  '125 Smith Street, Melbourne VIC',
  '89 Collins Avenue, Melbourne VIC',
  '234 Park Street, Melbourne VIC',
]

mockRouter.get('/appraisal/comparable-sales/search', (req, res) => {
  const addressRaw = typeof req.query.address === 'string' ? req.query.address.trim() : ''
  const propertyTypeRaw =
    typeof req.query.propertyType === 'string' ? req.query.propertyType.trim().toLowerCase() : ''
  const context = createAppraisalContext(req.query as Record<string, unknown>)
  const snapshot = buildAppraisalSnapshot(context)
  const isMatch = KNOWN_PROPERTY_ADDRESSES.some(
    (known) => known.toLowerCase() === addressRaw.toLowerCase(),
  )

  res.json({
    isMatch,
    subjectProperty: isMatch
      ? null
      : {
          address: addressRaw,
          propertyType:
            propertyTypeRaw && propertyTypeRaw !== 'all' ? toTitleCase(propertyTypeRaw) : 'House',
          beds: 3,
          baths: 2,
          areaSqm: 430,
        },
    sales: snapshot.comparables,
  })
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

mockRouter.get('/appraisal/market-intelligence-overview', (req, res) => {
  const context = createAppraisalContext(req.query as Record<string, unknown>)

  res.json({
    suburbLabel: context.suburb,
    stats: [
      { id: 'median-price', label: 'Median Price', value: '$1.45M', trend: '+6.2% YoY' },
      { id: 'monthly-growth', label: 'Monthly Growth', value: '+0.52%', trend: '+0.08pp YoY' },
      { id: 'days-on-market', label: 'Days on Market', value: '18 days', trend: '-4 days YoY' },
      { id: 'rental-yield', label: 'Rental Yield', value: '3.2%', trend: '+0.1pp YoY' },
    ],
    priceTrend: [
      { month: 'Oct', priceIndex: 100 },
      { month: 'Nov', priceIndex: 103 },
      { month: 'Dec', priceIndex: 106 },
      { month: 'Jan', priceIndex: 108 },
      { month: 'Feb', priceIndex: 109 },
      { month: 'Mar', priceIndex: 111 },
      { month: 'Apr', priceIndex: 112 },
      { month: 'May', priceIndex: 114 },
      { month: 'Jun', priceIndex: 116 },
      { month: 'Jul', priceIndex: 118 },
      { month: 'Aug', priceIndex: 121 },
    ],
  })
})

mockRouter.get('/appraisal/report-templates', (_req, res) => {
  res.json([
    {
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
  ])
})

// Fallback used when Groq isn't configured (no GROQ_API_KEY) or the request fails,
// so the wizard still renders something instead of erroring out.
function buildStaticNarrativePreview(context: AppraisalInputContext, snapshot: ReturnType<typeof buildAppraisalSnapshot>) {
  return {
    title: 'Sample Narrative Preview',
    sections: [
      {
        heading: 'Executive Summary:',
        body: `${context.propertyType} at ${context.address} shows an indicative value range of ${snapshot.rangeLabel}. The estimate is supported by nearby comparable sales in ${context.suburb} ${context.state}.`,
      },
      {
        heading: 'Property Analysis:',
        body: `Configured as ${context.bedrooms} bed, ${context.bathrooms} bath, ${context.parking} parking on approximately ${context.landSizeSqm} sqm, this property profile aligns with active local demand patterns and recent turnover data.`,
      },
    ],
    disclaimer:
      'Full report includes market context, comparable evidence and a synthesised pricing rationale based on the provided property details.',
  }
}

mockRouter.get('/appraisal/narrative-preview', async (req, res) => {
  const context = createAppraisalContext(req.query as Record<string, unknown>)
  const snapshot = buildAppraisalSnapshot(context)
  const reportType: ReportType = isReportType(req.query.reportType) ? req.query.reportType : 'vendor-appraisal'

  try {
    const narrativeText = await generateNarrative(reportType, {
      address: context.address,
      suburb: context.suburb,
      state: context.state,
      postcode: context.postcode,
      propertyType: context.propertyType,
      bedrooms: context.bedrooms,
      bathrooms: context.bathrooms,
      parking: context.parking,
      landSizeSqm: context.landSizeSqm,
      rangeLabel: snapshot.rangeLabel,
      midpointLabel: snapshot.midpointLabel,
      comparables: snapshot.comparables.map((c) => ({
        address: c.address,
        price: c.price,
        beds: c.beds,
        baths: c.baths,
        areaSqm: c.areaSqm,
        distanceKm: c.distanceKm,
      })),
    })

    const paragraphs = narrativeText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)

    res.json({
      title: `${REPORT_PROMPTS[reportType].label} — AI Narrative`,
      sections: paragraphs.map((body, index) => ({
        heading: index === 0 ? `${REPORT_PROMPTS[reportType].label}:` : '',
        body,
      })),
      disclaimer:
        'Generated by AI from the property details and comparable sales provided. Review before sending to a client.',
    })
  } catch (error) {
    console.error(`Groq narrative generation failed for reportType=${reportType}, falling back to static preview:`, error)
    res.json(buildStaticNarrativePreview(context, snapshot))
  }
})

mockRouter.get('/appraisal/appraisal-summary', (req, res) => {
  const context = createAppraisalContext(req.query as Record<string, unknown>)
  const snapshot = buildAppraisalSnapshot(context)

  res.json({
    eyebrow: 'RELAIVE · AGENT APPRAISAL REPORT',
    date: '02/08/2026',
    street: `${context.streetNumber} ${context.streetName}`,
    suburbLine: `${context.suburb} ${context.state} ${context.postcode}`,
    featuresLine: `${context.propertyType} · ${context.bedrooms} bed · ${context.bathrooms} bath · ${context.landSizeSqm}m²`,
    appraisalLabel: 'Sample Market Appraisal',
    priceRange: snapshot.rangeLabel,
    midpointEstimate: snapshot.midpointLabel,
    stats: [
      { id: 'comparables', value: String(snapshot.comparables.length), label: 'Comparables' },
      { id: 'clearance-rate', value: '78%', label: 'Clearance Rate' },
      { id: 'days-on-mkt', value: '22 avg', label: 'Days on Mkt' },
      { id: 'annual-growth', value: '+8.2%', label: 'Annual Growth' },
    ],
  })
})

mockRouter.get('/appraisal/executive-summary', (req, res) => {
  const context = createAppraisalContext(req.query as Record<string, unknown>)
  const snapshot = buildAppraisalSnapshot(context)

  res.json({
    title: '1. EXECUTIVE SUMMARY',
    paragraphs: [
      [
        {
          text: `This ${context.propertyType.toLowerCase()} at ${context.address} has been synthesised as a ${context.bedrooms}-bed, ${context.bathrooms}-bath home with ${context.parking} parking spaces on ${context.landSizeSqm}m² of land. It sits in ${context.suburb}, one of the tracked local markets in ${context.state}.`,
        },
      ],
      [
        {
          text: 'Based on nearby synthesised comparable sales and room/land-size weighting, the sample valuation model has derived an appraisal range of ',
        },
        {
          text: snapshot.rangeLabel,
          highlight: true,
        },
        {
          text: `, with ${snapshot.midpointLabel.toLowerCase()}. Properties with a similar profile in ${context.suburb} continue to show steady buyer demand and moderate selling windows.`,
        },
      ],
      [
        {
          text: `Land area and room count are the largest value contributors in this simple model. For this property, the ${context.landSizeSqm}m² footprint and ${context.bedrooms}-bed layout support positioning toward the middle-to-upper section of the estimate range.`,
        },
      ],
    ],
    observationTitle: 'Sample Key Observation',
    observationMessage: `The closest comparable is ${snapshot.comparables[0].address} (${formatCurrency(snapshot.comparables[0].price)}), which anchors the lower end due to smaller footprint and fewer features.`,
  })
})

mockRouter.get('/appraisal/property-specific-factors', (req, res) => {
  const context = createAppraisalContext(req.query as Record<string, unknown>)

  res.json({
    title: '2. PROPERTY-SPECIFIC FACTORS',
    valueAddingTitle: 'VALUE-ADDING FACTORS',
    valueAdding: [
      {
        id: 'land-holding',
        title: 'Land holding contribution',
        description: `${context.landSizeSqm}m² land size contributes strongly to valuation depth in ${context.suburb}.`,
      },
      {
        id: 'bedroom-depth',
        title: 'Bedroom configuration',
        description: `${context.bedrooms} bedrooms align with mainstream demand for ${context.propertyType.toLowerCase()} stock.`,
      },
      {
        id: 'bathroom-balance',
        title: 'Bathroom and parking utility',
        description: `${context.bathrooms} bathrooms and ${context.parking} parking spaces improve buyer practicality and liquidity.`,
      },
    ],
    riskTitle: 'RISK & LIMITING FACTORS',
    risk: [
      {
        id: 'data-freshness',
        title: 'Synthetic model output',
        description: 'Figures are generated from simple rules and should be treated as indicative, not formal valuation advice.',
      },
      {
        id: 'local-variation',
        title: 'Local micro-market variance',
        description: `${context.suburb} transactions may vary based on street-level factors not captured in this simplified model.`,
      },
    ],
  })
})

mockRouter.get('/appraisal/agent-recommendations', (_req, res) => {
  res.json({
    title: '3. AGENT RECOMMENDATIONS',
    items: [
      {
        id: 'campaign',
        title: 'Campaign Strategy',
        description: 'A four-week auction campaign commencing in the first week of September 2026 is recommended to coincide with the spring uplift in buyer activity. Set a buyer price guide of $1,400,000-$1,500,000 to attract the widest possible buyer pool and maximise competitive tension at auction.',
        iconKey: 'campaign',
      },
      {
        id: 'presentation',
        title: 'Presentation Priorities',
        description: 'Invest in professional styling - estimate $3,500-$5,000. Focus on north-facing garden staging and kitchen presentation. Repaint front facade if not recently done. Highlight the land size and school catchment prominently in all marketing copy.',
        iconKey: 'presentation',
      },
      {
        id: 'marketing',
        title: 'Marketing Channels',
        description: 'Allocate 60% of marketing budget to digital (REA Premium+, Domain Premiere+), 30% to social media (Instagram/Facebook geo-targeted to Stonnington and Port Phillip postcodes), and 10% to print (local papers). Estimated marketing budget: $8,000-$12,000.',
        iconKey: 'marketing',
        highlighted: true,
      },
    ],
  })
})

mockRouter.get('/appraisal/appraisal-disclaimer', (_req, res) => {
  res.json({
    title: 'Disclaimer:',
    message: 'This sample report was prepared for demonstration purposes and is intended as a guidance tool only. It does not constitute a formal property valuation under the Valuers Act 2003 (Vic) and should not be relied upon as such in legal, financial, or lending contexts. All figures are estimates based on publicly available transaction data and sample modelling. Relaive recommends this report be reviewed by a licensed real estate agent or certified practising valuer before being presented to vendors or third parties. Market conditions may change rapidly; this appraisal has a recommended validity period of 90 days from the date of generation.',
    footer: 'Generated by Relaive · relaive.com.au · Report ID: RPT-9TH5PRUA',
  })
})
