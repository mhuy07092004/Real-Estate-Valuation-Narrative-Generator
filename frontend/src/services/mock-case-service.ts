export type CaseStatus =
  | 'valuer_review'
  | 'evidence_collection'
  | 'reviewer_approval'
  | 'approved'
  | 'exported'
  | 'draft'
  | 'returned_for_revision'

/**
 * Shape the backend should return for each row of the valuation case list.
 *
 * @typedef {Object} CaseItem
 * @property {string} id - case code, e.g. "VC-2047"
 * @property {string} address
 * @property {string} suburb - e.g. "Richmond VIC 3121"
 * @property {string} clientName - e.g. "ANZ Bank" or "Private Client"
 * @property {CaseStatus} status
 * @property {string} purpose - e.g. "Market Valuation"
 * @property {number|null} confidence - 0-100, null when not yet scored (e.g. draft)
 * @property {string} updatedAt - ISO timestamp; "time ago" formatting happens on the frontend
 * @property {boolean} hasWarning - show a warning indicator next to the case id
 */
export type CaseItem = {
  id: string
  address: string
  suburb: string
  clientName: string
  status: CaseStatus
  purpose: string
  confidence: number | null
  updatedAt: string
  hasWarning: boolean
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

const CASE_LIST_DATA: CaseItem[] = [
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

export function getCaseListMockData(): CaseItem[] {
  return CASE_LIST_DATA
}
