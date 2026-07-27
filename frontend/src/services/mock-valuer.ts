// Valuer-only mock data — evidence centre + valuation cases / reports.

import type { CaseItem } from './mock-dashboard'
import { daysAgo, hoursAgo } from './mock-common'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EvidenceCategory = 'comparable' | 'market' | 'document' | 'history' | 'missing'
export type EvidenceStatus = 'verified' | 'pending' | 'missing'

/** Shape the backend should return for each row of the evidence centre list. */
export type EvidenceItem = {
  id: string
  title: string
  detail: string
  category: EvidenceCategory
  source: string
  status: EvidenceStatus
  confidence: number | null
  updatedAt: string
}

export type EvidenceCentreStat = {
  label: string
  value: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type EvidenceCentreMockPayload = {
  totalItems: number
  missingCount: number
  stats: EvidenceCentreStat[]
}

export type ValuationCasesStat = {
  label: string
  value: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type ValuationCasesMockPayload = {
  totalCases: number
  returnedForRevision: number
  stats: ValuationCasesStat[]
}

// ---------------------------------------------------------------------------
// Evidence centre data
// ---------------------------------------------------------------------------

const EVIDENCE_LIST_DATA: EvidenceItem[] = [
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
    id: 'EV-3011',
    title: '9 Park Ave auction',
    detail: 'Fitzroy VIC 3065 · Sold $1.12m',
    category: 'comparable',
    source: 'Domain',
    status: 'verified',
    confidence: 88,
    updatedAt: hoursAgo(5),
  },
  {
    id: 'EV-3010',
    title: '22 Harbour Dr private sale',
    detail: 'South Yarra VIC 3141 · 4 bed house',
    category: 'comparable',
    source: 'RP Data',
    status: 'pending',
    confidence: 76,
    updatedAt: daysAgo(1),
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
    id: 'EV-3008',
    title: 'Richmond rental yield report',
    detail: 'Gross yield 3.8% · Vacancy 1.2%',
    category: 'market',
    source: 'SQM Research',
    status: 'verified',
    confidence: 81,
    updatedAt: daysAgo(2),
  },
  {
    id: 'EV-3007',
    title: 'Melbourne auction clearance',
    detail: 'Weekend clearance rate 68%',
    category: 'market',
    source: 'REA Group',
    status: 'pending',
    confidence: 74,
    updatedAt: daysAgo(3),
  },
  {
    id: 'EV-3006',
    title: 'Title search — 12 Church St',
    detail: 'Certificate of Title VOL 10234 FOL 567',
    category: 'document',
    source: 'LANDATA',
    status: 'verified',
    confidence: 95,
    updatedAt: hoursAgo(8),
  },
  {
    id: 'EV-3005',
    title: 'Building inspection report',
    detail: 'Pre-purchase inspection · No major defects',
    category: 'document',
    source: 'Client upload',
    status: 'verified',
    confidence: 90,
    updatedAt: daysAgo(2),
  },
  {
    id: 'EV-3004',
    title: 'Council rates notice',
    detail: 'FY2025–26 annual rates assessment',
    category: 'document',
    source: 'City of Yarra',
    status: 'pending',
    confidence: 70,
    updatedAt: daysAgo(4),
  },
  {
    id: 'EV-3003',
    title: 'Prior sale 2021',
    detail: 'Sold $890,000 · May 2021',
    category: 'history',
    source: 'CoreLogic',
    status: 'verified',
    confidence: 94,
    updatedAt: daysAgo(5),
  },
  {
    id: 'EV-3002',
    title: 'Prior sale 2016',
    detail: 'Sold $720,000 · Nov 2016',
    category: 'history',
    source: 'RP Data',
    status: 'verified',
    confidence: 91,
    updatedAt: daysAgo(5),
  },
  {
    id: 'EV-3001',
    title: 'Planning permit 2019',
    detail: 'Extension approved · Permit PP-2019-441',
    category: 'history',
    source: 'City of Yarra',
    status: 'pending',
    confidence: 78,
    updatedAt: daysAgo(6),
  },
  {
    id: 'EV-3000',
    title: 'Recent comparable within 200m',
    detail: 'No verified sale in radius in last 90 days',
    category: 'missing',
    source: 'System check',
    status: 'missing',
    confidence: null,
    updatedAt: hoursAgo(1),
  },
  {
    id: 'EV-2999',
    title: 'Flood overlay certificate',
    detail: 'Required for lending support purpose',
    category: 'missing',
    source: 'System check',
    status: 'missing',
    confidence: null,
    updatedAt: hoursAgo(3),
  },
]

export function getEvidenceListMockData(): EvidenceItem[] {
  return EVIDENCE_LIST_DATA
}

export function getEvidenceCentreMockData(): EvidenceCentreMockPayload {
  const comparable = EVIDENCE_LIST_DATA.filter((item) => item.category === 'comparable').length
  const market = EVIDENCE_LIST_DATA.filter((item) => item.category === 'market').length
  const documents = EVIDENCE_LIST_DATA.filter((item) => item.category === 'document').length
  const missing = EVIDENCE_LIST_DATA.filter((item) => item.category === 'missing').length

  return {
    totalItems: EVIDENCE_LIST_DATA.length,
    missingCount: missing,
    stats: [
      { label: 'Comparable Sales', value: String(comparable), tone: 'blue' },
      { label: 'Market Sources', value: String(market), tone: 'teal' },
      { label: 'Documents', value: String(documents), tone: 'sky' },
      { label: 'Missing Evidence', value: String(missing), tone: 'orange' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Valuation cases / reports list
// ---------------------------------------------------------------------------

const VALUER_CASE_LIST: CaseItem[] = [
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
  {
    id: 'VC-2045',
    address: '7 Collins St',
    suburb: 'Melbourne VIC 3000',
    clientName: 'Westpac',
    status: 'reviewer_approval',
    purpose: 'Internal Assessment',
    confidence: 89,
    updatedAt: daysAgo(1),
    hasWarning: false,
  },
  {
    id: 'VC-2044',
    address: '7 Harbour Dr',
    suburb: 'South Yarra VIC 3141',
    clientName: 'Private Client',
    status: 'approved',
    purpose: 'Retrospective Review',
    confidence: 93,
    updatedAt: daysAgo(2),
    hasWarning: false,
  },
  {
    id: 'VC-2043',
    address: '33 Oak St',
    suburb: 'Prahran VIC 3181',
    clientName: 'Private Client',
    status: 'exported',
    purpose: 'Buyer Advisory',
    confidence: 88,
    updatedAt: daysAgo(3),
    hasWarning: false,
  },
  {
    id: 'VC-2042',
    address: '5 Marina Rd',
    suburb: 'Williamstown VIC 3016',
    clientName: 'ANZ Bank',
    status: 'draft',
    purpose: 'Market Valuation',
    confidence: null,
    updatedAt: daysAgo(4),
    hasWarning: false,
  },
  {
    id: 'VC-2041',
    address: '88 High St',
    suburb: 'Northcote VIC 3070',
    clientName: 'NAB',
    status: 'returned_for_revision',
    purpose: 'Lending Support',
    confidence: 68,
    updatedAt: daysAgo(5),
    hasWarning: true,
  },
]

// ---------------------------------------------------------------------------
// Valuation cases stats
// ---------------------------------------------------------------------------

const VALUATION_CASES_DATA: ValuationCasesMockPayload = {
  totalCases: 28,
  returnedForRevision: 3,
  stats: [
    { label: 'In Review', value: '7', tone: 'blue' },
    { label: 'Low Confidence', value: '4', tone: 'orange' },
    { label: 'Awaiting Approval', value: '5', tone: 'sky' },
    { label: 'Approved this month', value: '12', tone: 'teal' },
  ],
}

export function getValuationCasesMockData(): ValuationCasesMockPayload {
  return VALUATION_CASES_DATA
}

export function getValuerCaseListMockData(): CaseItem[] {
  return VALUER_CASE_LIST
}
