// Investor-only mock data — ROI & cash-flow calculator.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoiSummaryTone = 'green' | 'red' | 'navy' | 'net'

export type RoiSummaryRow = {
  label: string
  amount: number
  tone: RoiSummaryTone
}

export type RoiStatMetric = {
  label: string
  value: string
  trend: string
  tone: 'blue' | 'teal' | 'orange' | 'sky'
}

export type RoiReturnTone = 'green' | 'red' | 'navy'

export type RoiReturnRow = {
  label: string
  display: string
  tone: RoiReturnTone
}

export type RoiCalculationMock = {
  annualSummary: RoiSummaryRow[]
  metrics: RoiStatMetric[]
  investmentReturns: RoiReturnRow[]
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const ROI_CALCULATION_DATA: RoiCalculationMock = {
  annualSummary: [
    { label: 'Annual Rental Income', amount: 50000, tone: 'green' },
    { label: 'Annual Mortgage Repayments', amount: -2000, tone: 'navy' },
    { label: 'Annual Operating Expenses', amount: -45000, tone: 'navy' },
    { label: 'Management Fees', amount: -5000, tone: 'navy' },
    { label: 'Net Annual Cash-Flow', amount: -52000, tone: 'net' },
  ],
  metrics: [
    {
      label: 'Loan Amount',
      value: '$300,000',
      trend: 'monthly payment: $25,000',
      tone: 'blue',
    },
    {
      label: 'Break-even Rent',
      value: '$1,165',
      trend: 'current: $650/wk',
      tone: 'teal',
    },
  ],
  investmentReturns: [
    { label: 'Gross Yield', display: '4.0%', tone: 'green' },
    { label: 'Net Yield', display: '2.6%', tone: 'navy' },
    { label: 'Monthly Cash-Flow', display: '$2,341/mth', tone: 'red' },
    { label: 'Cash-on-Cash Returns', display: '-16.5%', tone: 'red' },
  ],
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getRoiCalculationMockData(): RoiCalculationMock {
  return ROI_CALCULATION_DATA
}
