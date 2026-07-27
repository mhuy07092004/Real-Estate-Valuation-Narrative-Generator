// Buyer-only mock data — affordability calculator + property search/saved + reports.

import type { PropertyCardData } from '../components/ui/property-card/property-card'
import type { CaseItem } from './mock-dashboard'
import { daysAgo, hoursAgo } from './mock-common'

// ---------------------------------------------------------------------------
// Types — affordability
// ---------------------------------------------------------------------------

export type AffordabilitySummaryTone = 'green' | 'red' | 'navy' | 'net'

export type AffordabilitySummaryRow = {
  label: string
  amount: number
  tone: AffordabilitySummaryTone
}

export type AffordabilityStatMetric = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type AffordabilityReturnTone = 'green' | 'red' | 'navy'

export type AffordabilityReturnRow = {
  label: string
  display: string
  tone: AffordabilityReturnTone
}

export type AffordabilityCalculationMock = {
  annualSummary: AffordabilitySummaryRow[]
  metrics: AffordabilityStatMetric[]
  investmentReturns: AffordabilityReturnRow[]
}

// ---------------------------------------------------------------------------
// Data — affordability
// ---------------------------------------------------------------------------

const AFFORDABILITY_CALCULATION_DATA: AffordabilityCalculationMock = {
  annualSummary: [
    { label: 'Annual Rental Income', amount: 42000, tone: 'green' },
    { label: 'Annual Mortgage Repayments', amount: -28000, tone: 'navy' },
    { label: 'Annual Operating Expenses', amount: -8500, tone: 'navy' },
    { label: 'Management Fees', amount: -3200, tone: 'navy' },
    { label: 'Net Annual Cash-Flow', amount: 2300, tone: 'net' },
  ],
  metrics: [
    {
      label: 'Loan Amount',
      value: '$550,000',
      trend: 'monthly payment: $3,200',
      tone: 'blue',
    },
    {
      label: 'Break-even Rent',
      value: '$820',
      trend: 'current: $750/wk',
      tone: 'teal',
    },
  ],
  investmentReturns: [
    { label: 'Gross Yield', display: '5.2%', tone: 'green' },
    { label: 'Net Yield', display: '3.1%', tone: 'navy' },
    { label: 'Monthly Cash-Flow', display: '$192/mth', tone: 'green' },
    { label: 'Cash-on-Cash Returns', display: '1.8%', tone: 'navy' },
  ],
}

export function getAffordabilityCalculationMockData(): AffordabilityCalculationMock {
  return AFFORDABILITY_CALCULATION_DATA
}

// ---------------------------------------------------------------------------
// Data — property search / saved
// ---------------------------------------------------------------------------

export const MOCK_PROPERTIES: PropertyCardData[] = [
  {
    id: 'prop-1',
    address: {
      street: '45 Clarendon St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1180000,
    estimatedRange: { min: '$1.09M', max: '$1.21M' },
    propertyType: 'House',
    features: { beds: 3, baths: 2, areaSqm: 312 },
    listedDays: 8,
    status: 'within_range',
  },
  {
    id: 'prop-2',
    address: {
      street: '12 Park St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 920000,
    estimatedRange: { min: '$890k', max: '$960k' },
    propertyType: 'Unit',
    features: { beds: 2, baths: 1, areaSqm: 98 },
    listedDays: 14,
    status: 'below_range',
  },
  {
    id: 'prop-3',
    address: {
      street: '8 Dorcas St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1450000,
    estimatedRange: { min: '$1.32M', max: '$1.48M' },
    propertyType: 'Townhouse',
    features: { beds: 4, baths: 3, areaSqm: 245, parking: 2 },
    listedDays: 3,
    status: 'above_range',
  },
  {
    id: 'prop-4',
    address: {
      street: '22 Bank St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1050000,
    estimatedRange: { min: '$980k', max: '$1.12M' },
    propertyType: 'House',
    features: { beds: 3, baths: 2, areaSqm: 280 },
    listedDays: 21,
    status: 'within_range',
  },
  {
    id: 'prop-5',
    address: {
      street: '5 Coventry St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 785000,
    estimatedRange: { min: '$720k', max: '$800k' },
    propertyType: 'Unit',
    features: { beds: 2, baths: 1, areaSqm: 85 },
    listedDays: 5,
    status: 'below_range',
  },
  {
    id: 'prop-6',
    address: {
      street: '31 Moray St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1620000,
    estimatedRange: { min: '$1.55M', max: '$1.70M' },
    propertyType: 'House',
    features: { beds: 4, baths: 2, areaSqm: 420, parking: 2 },
    listedDays: 11,
    status: 'above_range',
  },
]

export const MOCK_SAVED_PROPERTIES: PropertyCardData[] = [
  {
    id: 'saved-1',
    address: {
      street: '18 Cecil St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 1325000,
    estimatedRange: { min: '$1.25M', max: '$1.38M' },
    propertyType: 'House',
    features: { beds: 3, baths: 2, areaSqm: 295, parking: 1 },
    listedDays: 6,
    status: 'within_range',
  },
  {
    id: 'saved-2',
    address: {
      street: '9 York St',
      suburb: 'South Melbourne',
      state: 'VIC',
      postcode: '3205',
    },
    price: 865000,
    estimatedRange: { min: '$810k', max: '$890k' },
    propertyType: 'Unit',
    features: { beds: 2, baths: 2, areaSqm: 110 },
    listedDays: 12,
    status: 'below_range',
  },
]

// ---------------------------------------------------------------------------
// Buyer reports
// ---------------------------------------------------------------------------

const BUYER_REPORT_LIST: CaseItem[] = [
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
  },
]

export function getBuyerReportListMockData(): CaseItem[] {
  return BUYER_REPORT_LIST
}
