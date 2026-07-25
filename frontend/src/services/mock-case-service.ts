import type { DashboardRole } from '../features/dashboard/utils/dashboard-role'

export type CaseStatus =
  | 'valuer_review'
  | 'evidence_collection'
  | 'reviewer_approval'
  | 'approved'
  | 'exported'
  | 'draft'
  | 'returned_for_revision'

/**
 * Shape the backend should return for each row of the valuation case /
 * report list.
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
 * @property {DashboardRole} ownerRole - the dashboard role this record belongs to.
 *   The real backend MUST filter every case/report query by the requesting
 *   user's *active* role (e.g. `WHERE owner_role = :activeRole AND user_id = :userId`).
 *   A single account can hold multiple roles (agent + investor, etc.), so
 *   without this filter a user could see another role's private reports —
 *   this field exists purely to make that isolation explicit and testable
 *   in mock data before the real API exists.
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
  ownerRole: DashboardRole
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24)
}

const CASE_LIST_DATA: CaseItem[] = [
  // --- valuer: valuation cases / reports ---
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
    ownerRole: 'valuer',
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
    ownerRole: 'valuer',
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
    ownerRole: 'valuer',
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
    ownerRole: 'valuer',
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
    ownerRole: 'valuer',
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
    ownerRole: 'valuer',
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
    ownerRole: 'valuer',
  },

  // --- agent: client reports ---
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
    ownerRole: 'agent',
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
    ownerRole: 'agent',
  },
  {
    id: 'AG-3019',
    address: '18 Church St',
    suburb: 'Hawthorn VIC 3122',
    clientName: 'Chen Family Trust',
    status: 'approved',
    purpose: 'Rental Appraisal',
    confidence: 87,
    updatedAt: daysAgo(3),
    hasWarning: false,
    ownerRole: 'agent',
  },

  // --- investor: portfolio / investment reports ---
  {
    id: 'IN-4102',
    address: '9 Riverside Dr',
    suburb: 'Southbank VIC 3006',
    clientName: 'Self (Portfolio)',
    status: 'exported',
    purpose: 'Investment Analysis',
    confidence: 90,
    updatedAt: hoursAgo(5),
    hasWarning: false,
    ownerRole: 'investor',
  },
  {
    id: 'IN-4101',
    address: '61 Beach Rd',
    suburb: 'St Kilda VIC 3182',
    clientName: 'Self (Portfolio)',
    status: 'draft',
    purpose: 'Yield Assessment',
    confidence: null,
    updatedAt: daysAgo(2),
    hasWarning: false,
    ownerRole: 'investor',
  },
  {
    id: 'IN-4100',
    address: '14 Bay St',
    suburb: 'Port Melbourne VIC 3207',
    clientName: 'Self (Portfolio)',
    status: 'approved',
    purpose: 'Capital Growth Review',
    confidence: 84,
    updatedAt: daysAgo(4),
    hasWarning: false,
    ownerRole: 'investor',
  },

  // --- buyer: pre-purchase reports ---
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
    ownerRole: 'buyer',
  },
  {
    id: 'BY-5209',
    address: '27 Toorak Rd',
    suburb: 'Toorak VIC 3142',
    clientName: 'Self',
    status: 'draft',
    purpose: 'Due Diligence Review',
    confidence: null,
    updatedAt: daysAgo(2),
    hasWarning: false,
    ownerRole: 'buyer',
  },
  {
    id: 'BY-5208',
    address: '44 High St',
    suburb: 'Kew VIC 3101',
    clientName: 'Self',
    status: 'approved',
    purpose: 'Buyer Advisory Report',
    confidence: 91,
    updatedAt: daysAgo(5),
    hasWarning: false,
    ownerRole: 'buyer',
  },
]

/**
 * Returns the case/report rows owned by `ownerRole` only. `ownerRole` is
 * required (not optional) so every call site must state which role's data
 * it wants — mirrors the scoped query the real backend must run per
 * authenticated user + active role.
 */
export function getCaseListMockData(ownerRole: DashboardRole): CaseItem[] {
  return CASE_LIST_DATA.filter((item) => item.ownerRole === ownerRole)
}
